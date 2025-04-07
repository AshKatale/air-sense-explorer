import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Upload, 
  Camera, 
  Image, 
  AlertTriangle, 
  Factory, 
  Car, 
  Construction, 
  Wind, 
  Leaf, 
  Timer,
  Bot
} from 'lucide-react';
// Import dynamically to prevent SSR issues
import dynamic from 'next/dynamic';

interface AnalysisResult {
  pollutionHotspots: string[];
  pollutionSources: string[];
  airQualityAssessment: string;
  recommendations: string[];
  summary: string;
  aqiScore?: number;
  dominantPollutants?: string[];
  confidenceLevel?: number;
  timeOfDay?: string;
  weatherConditions?: string;
}

// Helper function to get source icon based on source text
const getSourceIcon = (source: string) => {
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes('factory') || sourceLower.includes('industrial')) {
    return <Factory className="h-5 w-5 text-red-500" />;
  } else if (sourceLower.includes('vehicle') || sourceLower.includes('traffic')) {
    return <Car className="h-5 w-5 text-orange-500" />;
  } else if (sourceLower.includes('construction') || sourceLower.includes('dust')) {
    return <Construction className="h-5 w-5 text-yellow-500" />;
  } else if (sourceLower.includes('smoke') || sourceLower.includes('burning')) {
    return <Wind className="h-5 w-5 text-purple-500" />;
  } else {
    return <AlertTriangle className="h-5 w-5 text-gray-500" />;
  }
};

// Helper function to get AQI color based on score
const getAQIColor = (score: number) => {
  if (score <= 50) return 'bg-green-500';
  if (score <= 100) return 'bg-yellow-500';
  if (score <= 150) return 'bg-orange-500';
  if (score <= 200) return 'bg-red-500';
  if (score <= 300) return 'bg-purple-500';
  return 'bg-purple-900';
};

// Helper function to get AQI level text based on score
const getAQILevel = (score: number) => {
  if (score <= 50) return 'Good';
  if (score <= 100) return 'Moderate';
  if (score <= 150) return 'Unhealthy for Sensitive Groups';
  if (score <= 200) return 'Unhealthy';
  if (score <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

// Extract JSON from Gemini response text
const extractJSON = (text: string) => {
  try {
    // Try to find JSON content enclosed in ```json and ``` or just standalone JSON
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      text.match(/(\{[\s\S]*\})/);
                      
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    // If no code block markers, try to parse the entire text
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse JSON from response:", error);
    console.log("Raw text:", text);
    return null;
  }
};

// Get model list for dropdown selection
const geminiModels = [
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-pro-vision", label: "Gemini 1.0 Pro Vision" }
];

const ImageAnalysis = () => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState<string>('');
  const [rawResponse, setRawResponse] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>("gemini-1.5-pro");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API key from local storage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    const savedModel = localStorage.getItem('gemini-model');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 5) {
        toast.error('You can upload a maximum of 5 images at once');
        return;
      }

      const validFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
      if (validFiles.length !== selectedFiles.length) {
        toast.error('Please upload only image files');
        return;
      }

      // Check file sizes
      const oversizedFiles = validFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('Some files exceed the 5MB limit');
        return;
      }

      const newImages = [...images, ...validFiles];
      setImages(newImages);

      // Create preview URLs
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
    
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini-api-key', key);
    toast.success('API key saved');
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    setSelectedModel(model);
    localStorage.setItem('gemini-model', model);
  };

  const encodeImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImages = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image to analyze');
      return;
    }

    if (!apiKey) {
      const key = prompt('Please enter your Gemini API key:');
      if (!key) {
        toast.error('API key is required to analyze images');
        return;
      }
      saveApiKey(key);
    }

    setIsAnalyzing(true);
    setProgress(10);
    setRawResponse('');
    setResults(null);

    try {
      // Progress simulation (since file encoding and API call don't have progress events)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 15;
          return next > 90 ? 90 : next;
        });
      }, 500);

      // Encode all images to base64
      setProgress(30);
      const encodedImages = await Promise.all(
        images.map(image => encodeImageToBase64(image))
      );
      setProgress(50);

      // Prepare the prompt
      const prompt = "Analyze these images for air pollution. Provide a detailed assessment with the following information in JSON format:\n" +
        "1. pollutionHotspots: Array of strings describing specific areas in the images with pollution\n" +
        "2. pollutionSources: Array of strings identifying likely sources of pollution\n" +
        "3. airQualityAssessment: String with detailed assessment of air quality\n" +
        "4. recommendations: Array of strings with recommendations to improve air quality\n" +
        "5. summary: Brief overview of findings\n" +
        "6. aqiScore: Estimated AQI score (0-500)\n" +
        "7. dominantPollutants: Array of strings naming likely pollutants\n" +
        "8. confidenceLevel: Number from 0-100 indicating confidence in analysis\n" +
        "9. timeOfDay: String indicating time of day in images\n" +
        "10. weatherConditions: String describing weather conditions\n\n" +
        "Format the response as valid JSON only. Do not include explanations outside the JSON object.";

      setProgress(70);
      
      // Direct call to the Gemini API
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
      
      // Prepare the request to Gemini API
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              ...encodedImages.map(base64 => ({
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64
                }
              }))
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        }
      };

      // Make the API call
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      clearInterval(progressInterval);
      setProgress(100);

      // Extract the text from the Gemini response
      let responseText = '';
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        responseText = data.candidates[0].content.parts[0].text;
        setRawResponse(responseText);
      } else {
        throw new Error('Invalid response format from Gemini API');
      }

      // Try to parse the JSON from the response
      const parsedResults = extractJSON(responseText);
      
      if (parsedResults) {
        setResults(parsedResults);
        toast.success('Analysis completed successfully');
      } else {
        throw new Error('Could not parse valid JSON from the Gemini response');
      }

    } catch (error: any) {
      console.error('Error analyzing images:', error);
      clearInterval();
      setProgress(0);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Image Pollution Analysis
        </CardTitle>
        <CardDescription>
          Upload images for AI-powered air pollution analysis using Google's Gemini API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* API Key and Model selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder="Gemini API Key (required)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-grow"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => saveApiKey(apiKey)}
                disabled={!apiKey}
              >
                Save Key
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <select 
                value={selectedModel}
                onChange={handleModelChange}
                className="flex-grow h-10 w-full bg-background rounded-md border border-input px-3 py-2 text-sm"
              >
                {geminiModels.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image upload area */}
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-2 font-medium">Click to upload images or drag and drop</p>
            <p className="text-sm text-muted-foreground">
              Support for JPG, PNG, WEBP (max 5 images, 5MB each)
            </p>
          </div>

          {/* Image previews */}
          {previews.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Uploaded Images ({previews.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={preview} 
                      alt={`Preview ${index + 1}`} 
                      className="h-24 w-full object-cover rounded-md"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyze button */}
          <div className="flex justify-between items-center">
            <Button
              variant={previews.length > 0 ? "default" : "outline"}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Add Images
            </Button>
            <Button 
              onClick={analyzeImages}
              disabled={isAnalyzing || previews.length === 0 || !apiKey}
              className="ml-auto"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  Analyzing...
                </>
              ) : "Analyze with Gemini AI"}
            </Button>
          </div>

          {/* Progress bar during analysis */}
          {isAnalyzing && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Analyzing images...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Analysis results */}
          {results && (
            <div className="mt-6 space-y-6">
              {/* Summary and AQI Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Summary */}
                <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Analysis Summary</h3>
                  <p className="text-sm">{results.summary}</p>
                  
                  {results.confidenceLevel && (
                    <div className="mt-3 flex items-center text-xs text-muted-foreground">
                      <span>AI Confidence:</span>
                      <div className="mx-2 h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${results.confidenceLevel}%` }}
                        ></div>
                      </div>
                      <span>{results.confidenceLevel}%</span>
                    </div>
                  )}
                </div>
                
                {/* AQI Score */}
                {results.aqiScore && (
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/30">
                    <h3 className="text-sm font-medium mb-2">Estimated Air Quality</h3>
                    <div className={`h-24 w-24 rounded-full flex items-center justify-center ${getAQIColor(results.aqiScore)} text-white`}>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{results.aqiScore}</div>
                        <div className="text-xs">AQI</div>
                      </div>
                    </div>
                    <p className="mt-2 font-medium text-sm">{getAQILevel(results.aqiScore)}</p>
                    
                    {results.dominantPollutants && results.dominantPollutants.length > 0 && (
                      <div className="mt-2 flex flex-wrap justify-center gap-1">
                        {results.dominantPollutants.map((pollutant, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {pollutant}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Environmental conditions */}
              {(results.timeOfDay || results.weatherConditions) && (
                <div className="bg-muted/20 p-3 rounded-lg flex items-center text-sm">
                  <Timer className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="mr-2 text-muted-foreground">Conditions:</span>
                  {results.timeOfDay && <span className="mr-2">{results.timeOfDay}</span>}
                  {results.weatherConditions && (
                    <>
                      {results.timeOfDay && <span className="mx-2">•</span>}
                      <span>{results.weatherConditions}</span>
                    </>
                  )}
                </div>
              )}

              {/* Detailed tabs */}
              <Tabs defaultValue="assessment" className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                  <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                  <TabsTrigger value="recommendations">Solutions</TabsTrigger>
                </TabsList>

                <TabsContent value="assessment" className="p-5 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                    Air Quality Assessment
                  </h4>
                  <p className="text-sm leading-relaxed">{results.airQualityAssessment}</p>
                </TabsContent>

                <TabsContent value="hotspots" className="p-5 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Map className="h-5 w-5 mr-2 text-red-500" />
                    Detected Pollution Hotspots
                  </h4>
                  <ul className="space-y-3">
                    {results.pollutionHotspots.map((hotspot, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm bg-background/40 p-3 rounded-md">
                        <Badge variant="destructive" className="mt-0.5 h-5 w-5 flex items-center justify-center p-0 rounded-full shrink-0">
                          {index + 1}
                        </Badge>
                        <div>
                          <p>{hotspot}</p>
                          {index < previews.length && (
                            <div className="mt-2">
                              <div className="relative inline-block">
                                <img 
                                  src={previews[index]} 
                                  alt={`Hotspot ${index + 1}`}
                                  className="h-20 object-cover rounded-md border border-muted"
                                />
                                <div className="absolute inset-0 bg-red-500/20 rounded-md"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="sources" className="p-5 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Factory className="h-5 w-5 mr-2 text-orange-500" />
                    Identified Pollution Sources
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {results.pollutionSources.map((source, index) => (
                      <li key={index} className="flex items-start gap-3 bg-background/40 p-3 rounded-md">
                        {getSourceIcon(source)}
                        <span className="text-sm">{source}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="recommendations" className="p-5 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Leaf className="h-5 w-5 mr-2 text-green-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-3">
                    {results.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm bg-background/40 p-3 rounded-md">
                        <Badge variant="outline" className="mt-0.5 bg-green-500/10 text-green-600 border-green-200">
                          {index + 1}
                        </Badge>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>

              {/* Raw response (for debugging) */}
              {rawResponse && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Raw API Response</summary>
                  <pre className="mt-2 p-2 bg-muted overflow-auto rounded-md">{rawResponse}</pre>
                </details>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageAnalysis;

// Map icon component
function Map(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  )
}