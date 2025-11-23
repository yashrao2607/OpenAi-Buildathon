"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';
import { toast } from '@/hooks/use-toast';

interface PriceAlert {
  id: string;
  commodity: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
  triggered?: boolean;
}

export function PriceAlerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [newAlert, setNewAlert] = useState({
    commodity: '',
    targetPrice: '',
    condition: 'above' as 'above' | 'below'
  });
  const [availableCommodities, setAvailableCommodities] = useState<string[]>([]);

  // Load alerts from localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem('priceAlerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Load available commodities from market data
  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const response = await fetch('/api/market-prices');
        const result = await response.json();
        if (result.success) {
          const commodities = Array.from(new Set(result.data.map((item: any) => item.commodity))).sort();
          setAvailableCommodities(commodities);
        }
      } catch (error) {
        console.error('Failed to fetch commodities:', error);
      }
    };
    fetchCommodities();
  }, []);

  const addAlert = () => {
    if (!newAlert.commodity || !newAlert.targetPrice) {
      toast({
        title: "❌ Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      commodity: newAlert.commodity,
      targetPrice: parseFloat(newAlert.targetPrice),
      condition: newAlert.condition,
      isActive: true,
      createdAt: new Date().toISOString(),
      triggered: false
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ commodity: '', targetPrice: '', condition: 'above' });
    
    toast({
      title: "✅ Price alert created",
      description: `Alert set for ${alert.commodity} at ₹${alert.targetPrice}`,
    });
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    toast({
      title: "🗑️ Alert deleted",
      description: "Price alert has been removed",
    });
  };

  const checkAlerts = async () => {
    try {
      const response = await fetch('/api/market-prices');
      const result = await response.json();
      
      if (result.success) {
        const updatedAlerts = alerts.map(alert => {
          const currentPrice = result.data.find((item: any) => 
            item.commodity === alert.commodity
          );
          
          if (currentPrice) {
            const price = parseFloat(currentPrice.price.replace(/[^\d.-]/g, ''));
            let triggered = false;
            
            if (alert.condition === 'above' && price >= alert.targetPrice) {
              triggered = true;
            } else if (alert.condition === 'below' && price <= alert.targetPrice) {
              triggered = true;
            }
            
            return { ...alert, triggered };
          }
          return alert;
        });
        
        setAlerts(updatedAlerts);
        
        // Show notifications for triggered alerts
        const newlyTriggered = updatedAlerts.filter(alert => 
          alert.triggered && alert.isActive
        );
        
        newlyTriggered.forEach(alert => {
          toast({
            title: "🔔 Price Alert!",
            description: `${alert.commodity} is now ${alert.condition} ₹${alert.targetPrice}`,
          });
        });
      }
    } catch (error) {
      console.error('Failed to check alerts:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline">🔔 Price Alerts</h2>
          <p className="text-muted-foreground">
            Set price alerts for your crops and get notified when prices reach your target
          </p>
        </div>
        <Button onClick={checkAlerts} variant="outline">
          <Bell className="h-4 w-4 mr-2" />
          Check Alerts
        </Button>
      </div>

      {/* Create new alert */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Price Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={newAlert.commodity} onValueChange={(value) => setNewAlert({...newAlert, commodity: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select commodity" />
              </SelectTrigger>
              <SelectContent>
                {availableCommodities.map(commodity => (
                  <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              placeholder="Target price (₹)"
              value={newAlert.targetPrice}
              onChange={(e) => setNewAlert({...newAlert, targetPrice: e.target.value})}
            />
            
            <Select value={newAlert.condition} onValueChange={(value: 'above' | 'below') => setNewAlert({...newAlert, condition: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={addAlert} className="w-full">
              Add Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Your Price Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No price alerts set yet</p>
              <p className="text-sm">Create your first alert above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={() => toggleAlert(alert.id)}
                      />
                      <Label className="text-sm">
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.commodity}</span>
                        {alert.triggered && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Triggered
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alert.condition === 'above' ? 'Above' : 'Below'} ₹{alert.targetPrice}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAlert(alert.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
