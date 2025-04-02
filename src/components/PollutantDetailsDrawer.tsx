
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pollutantInfo } from "@/services/airQualityService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface PollutantDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pollutant?: string;
  value?: number;
}

const PollutantDetailsDrawer = ({ isOpen, onClose, pollutant, value }: PollutantDetailsDrawerProps) => {
  if (!pollutant || !pollutantInfo[pollutant]) return null;
  
  const info = pollutantInfo[pollutant];
  const { thresholds } = info;
  
  // Calculate percentage for progress bar based on thresholds
  const calculatePercentage = () => {
    if (!value) return 0;
    
    if (value >= thresholds.poor) {
      return 100;
    } else if (value >= thresholds.moderate) {
      return 75 + (value - thresholds.moderate) / (thresholds.poor - thresholds.moderate) * 25;
    } else if (value >= thresholds.fair) {
      return 50 + (value - thresholds.fair) / (thresholds.moderate - thresholds.fair) * 25;
    } else if (value >= thresholds.good) {
      return 25 + (value - thresholds.good) / (thresholds.fair - thresholds.good) * 25;
    } else {
      return value / thresholds.good * 25;
    }
  };
  
  const getProgressColor = () => {
    if (!value) return "bg-gray-300";
    
    if (value >= thresholds.poor) {
      return "bg-aqi-verypoor";
    } else if (value >= thresholds.moderate) {
      return "bg-aqi-poor";
    } else if (value >= thresholds.fair) {
      return "bg-aqi-moderate";
    } else if (value >= thresholds.good) {
      return "bg-aqi-fair";
    } else {
      return "bg-aqi-good";
    }
  };
  
  const getSeverityText = () => {
    if (!value) return "Unknown";
    
    if (value >= thresholds.poor) {
      return "Very Poor";
    } else if (value >= thresholds.moderate) {
      return "Poor";
    } else if (value >= thresholds.fair) {
      return "Moderate";
    } else if (value >= thresholds.good) {
      return "Fair";
    } else {
      return "Good";
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {info.name} - {info.fullName}
          </SheetTitle>
          <SheetDescription>
            Detailed information about this pollutant
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6 pr-4">
            {value !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Level:</span>
                  <span className="font-semibold">{value} {info.unit}</span>
                </div>
                <Progress value={calculatePercentage()} className={getProgressColor()} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Good</span>
                  <span>Fair</span>
                  <span>Moderate</span>
                  <span>Poor</span>
                  <span>Very Poor</span>
                </div>
                <div className="text-center font-medium mt-2">
                  Severity: {getSeverityText()}
                </div>
              </div>
            )}
            
            <Tabs defaultValue="about">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="health">Health Effects</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Concentration Thresholds</h4>
                  <div className="mt-1 space-y-2">
                    <div className="grid grid-cols-2 text-sm">
                      <span className="text-muted-foreground">Good:</span>
                      <span>0 - {info.thresholds.good} {info.unit}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                      <span className="text-muted-foreground">Fair:</span>
                      <span>{info.thresholds.good} - {info.thresholds.fair} {info.unit}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                      <span className="text-muted-foreground">Moderate:</span>
                      <span>{info.thresholds.fair} - {info.thresholds.moderate} {info.unit}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                      <span className="text-muted-foreground">Poor:</span>
                      <span>{info.thresholds.moderate} - {info.thresholds.poor} {info.unit}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                      <span className="text-muted-foreground">Very Poor:</span>
                      <span>>{info.thresholds.poor} {info.unit}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sources" className="mt-4">
                <h4 className="text-sm font-medium">Common Sources</h4>
                <ul className="mt-2 space-y-2">
                  {info.sources.map((source, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      <span>{source}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="health" className="mt-4">
                <h4 className="text-sm font-medium">Health Effects</h4>
                <p className="text-sm text-muted-foreground mt-1">{info.healthEffects}</p>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default PollutantDetailsDrawer;
