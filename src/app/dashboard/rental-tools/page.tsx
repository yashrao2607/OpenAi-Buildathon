"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Search, Filter, Wrench, Phone, MessageCircle, MapPin, Star, Clock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/contexts/language-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePerDay: string;
  features: string[];
  condition: "excellent" | "good" | "fair";
  location: string;
  owner: {
    name: string;
    phone: string;
    rating: number;
  };
  availableFrom: string;
  image?: string;
}

const mockTools: Tool[] = [
  {
    id: "1",
    name: "Tractor",
    description: "Multi-purpose farming vehicle for plowing, tilling, and hauling",
    category: "tillage",
    pricePerDay: "₹800/day",
    features: ["25 HP Engine", "4WD", "Hydraulic System", "PTO Shaft"],
    condition: "excellent",
    location: "Pune, Maharashtra",
    owner: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      rating: 4.8
    },
    availableFrom: "2024-01-15"
  },
  {
    id: "2",
    name: "Combine Harvester",
    description: "Complete harvesting solution for grain crops",
    category: "harvesting",
    pricePerDay: "₹2000/day",
    features: ["Self-Propelled", "Grain Tank", "Straw Chopper"],
    condition: "good",
    location: "Nashik, Maharashtra",
    owner: {
      name: "Suresh Patel",
      phone: "+91 87654 32109",
      rating: 4.6
    },
    availableFrom: "2024-01-20"
  },
  {
    id: "3",
    name: "Drip Irrigation Kit",
    description: "Water-efficient irrigation system",
    category: "irrigation",
    pricePerDay: "₹100/day",
    features: ["1 Acre Coverage", "Pressure Compensating", "UV Resistant"],
    condition: "excellent",
    location: "Aurangabad, Maharashtra",
    owner: {
      name: "Priya Sharma",
      phone: "+91 76543 21098",
      rating: 4.9
    },
    availableFrom: "2024-01-10"
  },
  {
    id: "4",
    name: "Power Sprayer",
    description: "Pesticide and fertilizer application equipment",
    category: "irrigation",
    pricePerDay: "₹250/day",
    features: ["200L Tank", "High Pressure", "Adjustable Nozzles"],
    condition: "good",
    location: "Kolhapur, Maharashtra",
    owner: {
      name: "Amit Singh",
      phone: "+91 65432 10987",
      rating: 4.7
    },
    availableFrom: "2024-01-12"
  },
  {
    id: "5",
    name: "Seed Drill",
    description: "Precision seed planting equipment",
    category: "planting",
    pricePerDay: "₹300/day",
    features: ["12 Row", "Fertilizer Attachment", "Depth Control"],
    condition: "excellent",
    location: "Sangli, Maharashtra",
    owner: {
      name: "Vikram Reddy",
      phone: "+91 54321 09876",
      rating: 4.8
    },
    availableFrom: "2024-01-18"
  },
  {
    id: "6",
    name: "Farm Trailer",
    description: "Heavy-duty transport trailer for farm produce",
    category: "transport",
    pricePerDay: "₹300/day",
    features: ["2 Ton Capacity", "Hydraulic Tipping", "Heavy Duty Construction"],
    condition: "good",
    location: "Solapur, Maharashtra",
    owner: {
      name: "Deepak Joshi",
      phone: "+91 43210 98765",
      rating: 4.5
    },
    availableFrom: "2024-01-16"
  }
];

export default function RentalToolsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const filteredTools = mockTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculateTotalDays = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "bg-green-100 text-green-800";
      case "good": return "bg-blue-100 text-blue-800";
      case "fair": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    return <Wrench className="h-5 w-5" />;
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 font-headline">{t('rentalTools.title')}</h1>
          <p className="text-muted-foreground">
            {t('rentalTools.description')}
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('profile.backToDashboard')}
          </Link>
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('rentalTools.search.searchTools')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t('rentalTools.filter.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('rentalTools.filter.allCategories')}</SelectItem>
              <SelectItem value="tillage">{t('rentalTools.categories.tillage')}</SelectItem>
              <SelectItem value="planting">{t('rentalTools.categories.planting')}</SelectItem>
              <SelectItem value="harvesting">{t('rentalTools.categories.harvesting')}</SelectItem>
              <SelectItem value="irrigation">{t('rentalTools.categories.irrigation')}</SelectItem>
              <SelectItem value="processing">{t('rentalTools.categories.processing')}</SelectItem>
              <SelectItem value="transport">{t('rentalTools.categories.transport')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <Card key={tool.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(tool.category)}
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                </div>
                <Badge className={getConditionColor(tool.condition)}>
                  {t(`rentalTools.booking.${tool.condition}`)}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {tool.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Available from {new Date(tool.availableFrom).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" />
                  {tool.owner.rating} • {tool.owner.name}
                </div>
                <div className="text-lg font-semibold text-primary">
                  {tool.pricePerDay}
                </div>
                <div className="flex flex-wrap gap-1">
                  {tool.features.slice(0, 2).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {tool.features.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{tool.features.length - 2} more
                    </Badge>
                  )}
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedTool(tool)}
                    >
                      {t('rentalTools.booking.rentNow')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{tool.name}</DialogTitle>
                      <DialogDescription>
                        {tool.description}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Tool Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">{t('rentalTools.booking.ownerContact')}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{tool.owner.name}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current text-yellow-400" />
                                <span>{tool.owner.rating}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${tool.owner.phone}`} className="text-blue-600 hover:underline">
                                {tool.owner.phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {tool.location}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">{t('rentalTools.booking.condition')}</h4>
                          <Badge className={getConditionColor(tool.condition)}>
                            {t(`rentalTools.booking.${tool.condition}`)}
                          </Badge>
                          <div className="mt-2">
                            <h5 className="font-medium text-sm mb-1">Features:</h5>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {tool.features.map((feature, index) => (
                                <li key={index}>• {feature}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Booking Form */}
                      <div className="border-t pt-6">
                        <h4 className="font-medium mb-4">{t('rentalTools.booking.selectDates')}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              {t('rentalTools.booking.startDate')}
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground"
                                  )}
                                >
                                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={startDate}
                                  onSelect={setStartDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              {t('rentalTools.booking.endDate')}
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !endDate && "text-muted-foreground"
                                  )}
                                >
                                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={endDate}
                                  onSelect={setEndDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        
                        {startDate && endDate && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">{t('rentalTools.booking.totalDays')}:</span>
                                <span className="font-medium ml-2">{calculateTotalDays()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t('rentalTools.booking.dailyRate')}:</span>
                                <span className="font-medium ml-2">{tool.pricePerDay}</span>
                              </div>
                              <div className="col-span-2 border-t pt-2">
                                <span className="text-muted-foreground">{t('rentalTools.booking.totalAmount')}:</span>
                                <span className="font-bold text-lg ml-2">
                                  ₹{parseInt(tool.pricePerDay.replace(/[^\d]/g, '')) * calculateTotalDays()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button asChild className="flex-1">
                          <a href={`https://wa.me/${tool.owner.phone.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {t('rentalTools.booking.whatsappContact')}
                          </a>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                          <a href={`tel:${tool.owner.phone}`}>
                            <Phone className="mr-2 h-4 w-4" />
                            {t('rentalTools.booking.phoneNumber')}
                          </a>
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('rentalTools.search.noResults')}</h3>
          <p className="text-muted-foreground">{t('rentalTools.search.tryDifferentSearch')}</p>
        </div>
      )}
    </div>
  );
}
