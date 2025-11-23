
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Cloud,
  HeartPulse,
  LineChart,
  Banknote,
  Thermometer,
  Wind,
  Droplets,
  Calendar,
  Sun,
  CloudRain,
  CloudSun,
  ShoppingCart,
  Users,
  BookOpen,
  Wallet,
  Leaf,
  ArrowRight,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getWeatherForecast, type GetWeatherForecastOutput } from "@/ai/flows/get-weather-forecast";
import { recommendCrops, type RecommendCropsOutput } from "@/ai/flows/recommend-crops";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/contexts/language-context";
import { useNotifications } from "@/contexts/notification-context";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Info, TriangleAlert, CheckCircle, XCircle, Clock } from "lucide-react";
import MarketAnalysisSection from "@/components/MarketAnalysisSection";

const iconMap = {
  Cloud,
  Sun,
  CloudRain,
  CloudSun,
  Wind,
  Droplets,
};

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const { t, language } = useTranslation();
  const { notifications, removeNotification, markAsRead, markAllAsRead } = useNotifications();
  const [weatherData, setWeatherData] = useState<GetWeatherForecastOutput | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendCropsOutput | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  const quickLinks = [
    {
      title: t('nav.cropDoctor'),
      description: t('dashboard.quickLinks.cropDoctor'),
      href: "/dashboard/crop-doctor",
      icon: HeartPulse,
    },
    {
      title: t('nav.cropRecommender'),
      description: t('dashboard.quickLinks.cropRecommender'),
      href: "/dashboard/crop-recommender",
      icon: Leaf,
    },
    {
      title: t('nav.marketAnalyst'),
      description: t('dashboard.quickLinks.marketAnalyst'),
      href: "/dashboard/market-analyst",
      icon: LineChart,
    },
    {
      title: t('nav.govtSchemes'),
      description: t('dashboard.quickLinks.govtSchemes'),
      href: "/dashboard/schemes",
      icon: Banknote,
    },
    {
      title: t('nav.tracker'),
      description: t('dashboard.quickLinks.tracker'),
      href: "/dashboard/tracker",
      icon: Wallet,
    },
    {
      title: t('nav.rentalTools'),
      description: t('dashboard.quickLinks.rentalTools'),
      href: "/dashboard/rental-tools",
      icon: Wrench,
    },
    {
      title: t('nav.eLearning'),
      description: t('dashboard.quickLinks.eLearning'),
      href: "/dashboard/learn",
      icon: BookOpen,
    },
  ];

  useEffect(() => {
    const getCurrentSeason = () => {
        const month = new Date().getMonth(); // 0-11
        if (month >= 5 && month <= 9) return 'kharif'; // June to October
        if (month >= 10 || month <= 2) return 'rabi'; // November to March
        return 'zaid'; // April, May
    };

    const fetchDashboardData = async () => {
      const city = userProfile?.location?.split(',')[0] || "Pune";
      
      setLoadingWeather(true);
      setLoadingRecommendations(true);

      const weatherPromise = getWeatherForecast({ city });
      const recommendationsPromise = recommendCrops({
          soilType: 'loamy',
          climate: 'tropical',
          season: getCurrentSeason(),
          language: language,
      });

      const [weatherResult, recommendationsResult] = await Promise.allSettled([
        weatherPromise,
        recommendationsPromise,
      ]);

      if (weatherResult.status === 'fulfilled') {
        setWeatherData(weatherResult.value);
      } else {
        console.error("Failed to fetch weather", weatherResult.reason);
      }
      setLoadingWeather(false);

      if (recommendationsResult.status === 'fulfilled') {
        setRecommendations(recommendationsResult.value);
      } else {
        console.error("Failed to fetch recommendations", recommendationsResult.reason);
      }
      setLoadingRecommendations(false);
    };
    
    if (userProfile) {
        fetchDashboardData();
    }
  }, [userProfile, language]);
  
  const getIcon = (iconName: keyof typeof iconMap) => {
    const IconComponent = iconMap[iconName] || Cloud;
    return <IconComponent className="h-8 w-8 text-secondary-foreground" />;
  };
  
  const displayName = user?.displayName?.split(' ')[0] || t('dashboard.farmer');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <TriangleAlert className="h-4 w-4 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = (notificationId: number) => {
    markAsRead(notificationId);
  };

  const handleRemoveNotification = (notificationId: number) => {
    removeNotification(notificationId);
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="pt-5">
        <h1 className="text-3xl font-bold font-headline">{t('dashboard.welcome', { name: displayName })}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.description')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {quickLinks.map((link) => (
          <Link href={link.href} key={link.href} className="group">
            <Card className="h-full transition-all duration-300 group-hover:bg-secondary/50 group-hover:shadow-lg group-hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{link.title}</CardTitle>
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Featured Rental Tools Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              <CardTitle>{t('dashboard.featuredRentalTools.title')}</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/rental-tools">
                {t('dashboard.featuredRentalTools.viewAll')} <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <CardDescription>{t('dashboard.featuredRentalTools.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: t('rentalTools.tools.tractor.name'),
                description: t('rentalTools.tools.tractor.description'),
                price: t('rentalTools.tools.tractor.pricePerDay'),
                condition: 'excellent',
                location: 'Pune, Maharashtra',
                owner: 'Rajesh Kumar',
                rating: 4.8
              },
              {
                name: t('rentalTools.tools.dripSystem.name'),
                description: t('rentalTools.tools.dripSystem.description'),
                price: t('rentalTools.tools.dripSystem.pricePerDay'),
                condition: 'excellent',
                location: 'Aurangabad, Maharashtra',
                owner: 'Priya Sharma',
                rating: 4.9
              },
              {
                name: t('rentalTools.tools.sprayer.name'),
                description: t('rentalTools.tools.sprayer.description'),
                price: t('rentalTools.tools.sprayer.pricePerDay'),
                condition: 'good',
                location: 'Kolhapur, Maharashtra',
                owner: 'Amit Singh',
                rating: 4.7
              }
            ].map((tool, index) => (
              <Card key={index} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{tool.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Sun className="h-3 w-3 fill-current text-yellow-400" />
                      <span className="text-xs font-medium">{tool.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">{tool.price}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tool.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                        tool.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {t(`rentalTools.booking.${tool.condition}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{tool.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{tool.owner}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis Section */}
      <MarketAnalysisSection />
      
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.currentWeather')}</CardTitle>
                        <Cloud className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center sm:space-x-4">
                        {loadingWeather ? (
                        <div className="flex items-center space-x-4 w-full">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="space-y-2 pl-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                        ) : weatherData ? (
                            <>
                                {getIcon(weatherData.current.icon as keyof typeof iconMap)}
                                <div className="text-center sm:text-left mt-2 sm:mt-0">
                                    <div className="text-3xl font-bold">{weatherData.current.temperature}</div>
                                    <p className="text-sm text-muted-foreground">
                                    {t(`weather.conditions.${weatherData.current.condition}`)} in {weatherData.city}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm pl-4 mt-2 sm:mt-0">
                                    <div className="flex items-center gap-1">
                                        <Wind className="h-4 w-4" /> <span>{weatherData.current.wind}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Droplets className="h-4 w-4" /> <span>{weatherData.current.humidity}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                        <p className="text-sm text-muted-foreground">{t('dashboard.weatherUnavailable')}</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                           <Icons.sprout className="h-6 w-6 text-primary"/>
                           <CardTitle>{t('dashboard.recommendations.title')}</CardTitle>
                        </div>
                        <CardDescription>{t('dashboard.recommendations.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        {loadingRecommendations ? (
                             Array.from({length: 2}).map((_, i) => (
                                <Card key={i} className="flex items-center gap-4 p-4">
                                    <Skeleton className="h-20 w-20 rounded-lg"/>
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-1/2"/>
                                        <Skeleton className="h-4 w-full"/>
                                        <Skeleton className="h-4 w-3/4"/>
                                    </div>
                                </Card>
                             ))
                        ) : recommendations && recommendations.recommendedCrops.length > 0 ? (
                           recommendations.recommendedCrops.slice(0,2).map((cropName: string) => (
                            <Card key={cropName} className="overflow-hidden">
                                <div className="flex items-start gap-4 p-4">
                                    <Image src={`https://placehold.co/100x100.png`} alt={cropName} width={80} height={80} className="rounded-lg object-cover" data-ai-hint={`${cropName} crop`}/>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-base">{cropName}</h4>
                                        <p className="text-xs text-muted-foreground mt-1 mb-2 line-clamp-2">{recommendations.explanation}</p>
                                        <Button asChild size="sm" variant="secondary" className="text-xs">
                                            <Link href={`/dashboard/learn?q=${encodeURIComponent(cropName)}`}>
                                                Learn More <ArrowRight className="ml-1 h-3 w-3"/>
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                           ))
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4 md:col-span-2">{t('dashboard.recommendations.unavailable')}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card className="h-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>Important updates and alerts for your farm.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {notifications.length > 0 && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={markAllAsRead}
                                        className="text-xs"
                                    >
                                        Mark all read
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {notifications.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {notifications.map((notification) => (
                                    <div 
                                        key={notification.id}
                                        className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-secondary/50 ${
                                            !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                                        }`}
                                        onClick={() => handleNotificationClick(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className={`text-sm font-semibold ${
                                                        !notification.read ? 'text-foreground' : 'text-muted-foreground'
                                                    }`}>
                                                        {notification.title}
                                                    </h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveNotification(notification.id);
                                                        }}
                                                    >
                                                        <XCircle className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {notification.description}
                                                </p>
                                                {notification.timestamp && (
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{formatTimeAgo(notification.timestamp)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                                <Icons.wheat className="h-12 w-12 mb-4"/>
                                <p className="font-semibold">No new notifications</p>
                                <p className="text-sm">Check back later for updates on weather, market prices, and more.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
