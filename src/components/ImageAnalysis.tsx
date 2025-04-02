
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Camera, Image } from 'lucide-react';

interface AnalysisResult {
  pollutionHotspots: string[];
  pollutionSources: string[];
  airQualityAssessment: string;
  recommendations: string[];
  summary: string;
}

const ImageAnalysis = () => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const analyzeImages = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image to analyze');
      return;
    }

    setIsAnalyzing(true);

    try {
      // In a real implementation, you would send the images to a backend that calls the Gemini API
      // For now, we'll simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock response based on the images uploaded
      const mockResult: AnalysisResult = {
        pollutionHotspots: [
          'Industrial area in the northeast section of image 1',
          'Heavy traffic intersection visible in image 2',
          'Construction site with visible dust in image 3'
        ].slice(0, images.length),
        pollutionSources: [
          'Factory emissions (high levels of NO2 and PM2.5)',
          'Vehicle exhaust (CO and NO2)',
          'Construction dust (PM10)'
        ],
        airQualityAssessment: 'Moderate to poor air quality detected across the images. Particulate matter (PM2.5 and PM10) appears to be the primary concern, with elevated levels visible in images showing industrial activities.',
        recommendations: [
          'Increase vegetation cover near identified pollution hotspots',
          'Consider traffic reduction measures in high-congestion areas',
          'Implement dust control measures at construction sites',
          'Monitor air quality regularly in the identified areas'
        ],
        summary: `Analysis of ${images.length} image${images.length > 1 ? 's' : ''} shows evidence of ${images.length > 2 ? 'multiple' : 'some'} pollution sources. The most significant concerns are particulate matter from industrial activities and vehicle emissions.`
      };

      setResults(mockResult);
      toast.success('Analysis completed');

    } catch (error) {
      console.error('Error analyzing images:', error);
      toast.error('Failed to analyze images. Please try again.');
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
          Upload images of areas to analyze pollution levels using AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
              disabled={isAnalyzing || previews.length === 0}
              className="ml-auto"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  Analyzing...
                </>
              ) : "Analyze Pollution"}
            </Button>
          </div>

          {/* Analysis results */}
          {results && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Analysis Results</h3>
              <p className="text-sm text-muted-foreground mb-4">{results.summary}</p>

              <Tabs defaultValue="assessment" className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                  <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                  <TabsTrigger value="recommendations">Solutions</TabsTrigger>
                </TabsList>

                <TabsContent value="assessment" className="p-4 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-2">Air Quality Assessment</h4>
                  <p className="text-sm">{results.airQualityAssessment}</p>
                </TabsContent>

                <TabsContent value="hotspots" className="p-4 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-2">Detected Pollution Hotspots</h4>
                  <ul className="space-y-2">
                    {results.pollutionHotspots.map((hotspot, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Badge variant="destructive" className="mt-0.5 h-5 w-5 flex items-center justify-center p-0 rounded-full shrink-0">
                          {index + 1}
                        </Badge>
                        {hotspot}
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="sources" className="p-4 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-2">Identified Pollution Sources</h4>
                  <ul className="space-y-2">
                    {results.pollutionSources.map((source, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0"></span>
                        {source}
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="recommendations" className="p-4 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {results.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="mt-0.5 shrink-0">
                          {index + 1}
                        </Badge>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageAnalysis;
