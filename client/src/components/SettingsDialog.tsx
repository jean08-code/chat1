import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserSettingsPayload } from "@shared/schema";

type SettingsWithLabel = {
  darkMode: { value: boolean; label: string };
  notifications: { value: boolean; label: string };
  sound: { value: boolean; label: string };
  language: { value: string; label: string; options: { value: string; label: string }[] };
};

export default function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettingsPayload>({
    darkMode: false,
    notifications: true,
    sound: true,
    language: "en",
  });
  
  const { toast } = useToast();
  
  // Get user settings
  const { data: settings, isLoading } = useQuery<UserSettingsPayload>({
    queryKey: ["/api/user/settings"],
    enabled: isOpen, // Only fetch when dialog is open
  });
  
  // Update local settings when data changes
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);
  
  // Update user settings
  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: async (settings: UserSettingsPayload) => {
      return await apiRequest("POST", "/api/user/settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: "Failed to update settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Settings options with labels
  const settingsWithLabels: SettingsWithLabel = {
    darkMode: { value: Boolean(localSettings.darkMode), label: "Dark Mode" },
    notifications: { value: localSettings.notifications !== false, label: "Notifications" },
    sound: { value: localSettings.sound !== false, label: "Sound Effects" },
    language: { 
      value: localSettings.language || "en", 
      label: "Language",
      options: [
        { value: "en", label: "English" },
        { value: "es", label: "Spanish" },
        { value: "fr", label: "French" },
        { value: "de", label: "German" },
        { value: "zh", label: "Chinese" },
      ]
    }
  };
  
  // Handle setting toggle
  const handleToggleSetting = (key: "darkMode" | "notifications" | "sound") => {
    setLocalSettings({
      ...localSettings,
      [key]: !(localSettings[key] as boolean)
    });
  };
  
  // Handle language change
  const handleLanguageChange = (value: string) => {
    setLocalSettings({
      ...localSettings,
      language: value
    });
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    updateSettings(localSettings);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your chat experience. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Toggle settings */}
            {Object.entries(settingsWithLabels)
              .filter(([key]) => key !== "language")
              .map(([key, setting]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="flex items-center space-x-2">
                    {setting.label}
                  </Label>
                  <Switch
                    id={key}
                    checked={Boolean(setting.value)}
                    onCheckedChange={() => handleToggleSetting(key as "darkMode" | "notifications" | "sound")}
                  />
                </div>
              ))}
            
            {/* Language selector */}
            <div className="flex items-center justify-between">
              <Label htmlFor="language" className="flex items-center space-x-2">
                {settingsWithLabels.language.label}
              </Label>
              <Select
                value={localSettings.language}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {settingsWithLabels.language.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings} disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}