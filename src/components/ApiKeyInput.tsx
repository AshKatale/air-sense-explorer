
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { setApiKey, getApiKey, isValidApiKey } from "@/services/airQualityService";

interface ApiKeyInputProps {
  onValidKey: () => void;
}

const ApiKeyInput = ({ onValidKey }: ApiKeyInputProps) => {
  const [apiKey, setApiKeyState] = useState(getApiKey() || "");
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const checkExistingKey = async () => {
      const savedKey = getApiKey();
      if (savedKey) {
        setValidating(true);
        const isValid = await isValidApiKey();
        setValidating(false);
        if (isValid) {
          onValidKey();
        }
      }
    };
    
    checkExistingKey();
  }, [onValidKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setValidating(true);
    const isValid = await setApiKey(apiKey.trim());
    setValidating(false);
    
    if (isValid) {
      toast.success("API key verified successfully!");
      onValidKey();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Enter OpenWeather API Key</CardTitle>
        <CardDescription>
          To use this application, you need an API key from OpenWeather. 
          <a 
            href="https://home.openweathermap.org/api_keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline ml-1"
          >
            Get one here
          </a>.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="apiKey"
                placeholder="Enter your OpenWeather API Key"
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Your API key will be stored locally in your browser.
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={validating}>
            {validating ? "Validating..." : "Submit"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ApiKeyInput;
