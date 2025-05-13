import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import ContactSidebar from "@/components/ContactSidebar";
import ChatArea from "@/components/ChatArea";
import { LoginPayload, User, Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function Chat() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useMobile();
  const queryClient = useQueryClient();
  
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  
  // Check authentication status
  const { data: authData, isLoading: authLoading } = useQuery<{ isAuthenticated: boolean; user?: User }>({
    queryKey: ["/api/auth/status"],
  });
  
  const currentUser = authData?.user || null;
  const isAuthenticated = authData?.isAuthenticated || false;

  // Fetch contacts when authenticated
  const { data: contacts = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated,
  });

  // Fetch messages for selected contact
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedContactId}`],
    enabled: isAuthenticated && selectedContactId !== null,
  });

  // Store messages by contact
  const [chatMessages, setChatMessages] = useState<Record<number, Message[]>>({});

  // Update chat messages when new messages come in
  useEffect(() => {
    if (selectedContactId && messages.length > 0) {
      setChatMessages(prev => ({
        ...prev,
        [selectedContactId]: messages
      }));
    }
  }, [selectedContactId, messages]);

  // Get selected contact
  const selectedContact = selectedContactId
    ? contacts.find(contact => contact.id === selectedContactId) || null
    : null;

  // Send message mutation
  const { mutate: sendMessage } = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedContactId) throw new Error("No contact selected");
      return await apiRequest("POST", "/api/messages", {
        receiverId: selectedContactId,
        content,
      });
    },
    onSuccess: () => {
      if (selectedContactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedContactId}`] });
      }
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Login mutation
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (data: LoginPayload) => {
      return await apiRequest("POST", "/api/login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/logout", null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      setSelectedContactId(null);
      setChatMessages({});
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    },
  });

  // Handle contact selection
  const handleContactSelect = (contactId: number) => {
    setSelectedContactId(contactId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Toggle sidebar visibility (mobile)
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Setup login form
  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: z.infer<typeof loginFormSchema>) => {
    login(data);
  };

  // Handle demo login (with pre-filled credentials)
  const handleDemoLogin = () => {
    login({ username: "daniel", password: "password123" });
  };

  // If not authenticated, show login form
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Welcome to Chat App</CardTitle>
            <CardDescription className="text-center">
              Login to start chatting with your friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-gray-500 text-center mb-2">
              Or try the demo with pre-filled credentials:
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleDemoLogin}
              disabled={isLoggingIn}
            >
              Demo Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="lg:hidden bg-white border-b w-full py-4 px-4 flex items-center justify-between fixed top-0 left-0 right-0 z-10">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <h1 className="text-xl font-semibold">Chat</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        </div>
      )}

      {/* Main content with sidebar and chat area */}
      <div className={`flex w-full ${isMobile ? 'mt-16' : ''}`}>
        {/* Sidebar */}
        <ContactSidebar
          currentUser={currentUser}
          selectedContactId={selectedContactId}
          onContactSelect={handleContactSelect}
          chatMessages={chatMessages}
          className={`${
            isMobile
              ? showSidebar
                ? 'fixed inset-0 z-40 mt-16'
                : 'hidden'
              : 'w-80'
          }`}
          onLogout={logout}
        />

        {/* Chat Area */}
        <ChatArea
          currentUser={currentUser}
          selectedContact={selectedContact}
          messages={messages}
          onSendMessage={sendMessage}
          onShowSidebar={toggleSidebar}
          className={isMobile && showSidebar ? 'hidden' : 'flex-1'}
        />
      </div>
    </div>
  );
}
