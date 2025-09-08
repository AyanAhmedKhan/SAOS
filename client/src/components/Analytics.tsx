import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Leaf, Zap } from 'lucide-react';
import type { WeiRecord } from '@/types';

interface AnalyticsProps {
  farmId: string;
}

export default function Analytics({ farmId }: AnalyticsProps) {
  // Get plots for the farm to fetch WEI data
  const { data: plots } = useQuery({
    queryKey: ['/api/farms', farmId, 'plots'],
    queryFn: () => api.getPlots(farmId),
    enabled: !!farmId,
  });

  const { data: weiData } = useQuery({
    queryKey: ['/api/analytics/wei', plots?.[0]?.id],
    queryFn: () => api.getWeiData(plots[0].id),
    enabled: !!plots?.[0]?.id,
  });

  // Mock data for cost-benefit and carbon footprint (would come from backend)
  const costBenefitData = {
    waterSavings: 127,
    energySavings: 89,
    yieldIncrease: 342,
    totalSavings: 558
  };

  const carbonData = {
    totalSaved: -245,
    reducedPumping: -180,
    solarIntegration: -65,
    optimizedIrrigation: 15
  };

  const formatCurrency = (amount: number) => `$${amount}`;

  return (
    <div className="space-y-6">
      {/* Water Efficiency Index */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Water Efficiency Index</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg width="128" height="128" className="transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="282.7"
                  strokeDashoffset={weiData?.score ? 282.7 - (weiData.score / 10) * 282.7 : 282.7}
                  style={{ filter: 'drop-shadow(0 0 8px hsl(var(--accent)))' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold font-mono text-accent" data-testid="wei-score">
                    {weiData?.score?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-xs text-muted-foreground">WEI Score</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Water Used (L)</span>
              <span className="font-mono" data-testid="water-used">
                {weiData?.waterUsed?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Yield (kg)</span>
              <span className="font-mono" data-testid="yield-obtained">
                {weiData?.yieldObtained?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Efficiency</span>
              <span className="font-mono text-accent" data-testid="efficiency-improvement">
                +12% vs baseline
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost-Benefit Analysis */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Cost-Benefit Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Water Savings</span>
                <span className="text-accent font-mono" data-testid="water-savings">
                  {formatCurrency(costBenefitData.waterSavings)}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className="bg-muted rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Energy Savings</span>
                <span className="text-primary font-mono" data-testid="energy-savings">
                  {formatCurrency(costBenefitData.energySavings)}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            
            <div className="bg-muted rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Yield Increase</span>
                <span className="text-chart-3 font-mono" data-testid="yield-increase">
                  {formatCurrency(costBenefitData.yieldIncrease)}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-chart-3 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between font-semibold">
                <span>Total Savings</span>
                <span className="text-accent font-mono" data-testid="total-savings">
                  {formatCurrency(costBenefitData.totalSavings)}/month
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carbon Footprint */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Leaf className="h-5 w-5" />
            <span>Carbon Footprint</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold font-mono text-chart-3" data-testid="carbon-saved">
              {carbonData.totalSaved}
            </div>
            <div className="text-sm text-muted-foreground">kg CO₂ saved</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-chart-5" />
                <span className="text-sm">Reduced Pumping</span>
              </div>
              <span className="font-mono text-sm" data-testid="pumping-reduction">
                {carbonData.reducedPumping} kg
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-primary rounded-sm"></div>
                <span className="text-sm">Solar Integration</span>
              </div>
              <span className="font-mono text-sm" data-testid="solar-integration">
                {carbonData.solarIntegration} kg
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Leaf className="h-4 w-4 text-accent" />
                <span className="text-sm">Optimized Irrigation</span>
              </div>
              <span className="font-mono text-sm" data-testid="irrigation-optimization">
                {carbonData.optimizedIrrigation > 0 ? '+' : ''}{carbonData.optimizedIrrigation}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
