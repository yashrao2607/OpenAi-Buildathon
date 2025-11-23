
"use client";

import React from "react";
import { Bell, Info, TriangleAlert, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/contexts/language-context";
import { useNotifications } from "@/contexts/notification-context";
import { Badge } from "./ui/badge";

export function Notifications() {
    const { t } = useTranslation();
    const { notifications, removeNotification, markAsRead, unreadCount } = useNotifications();

    const handleNotificationClick = (notificationId: number) => {
        markAsRead(notificationId);
        removeNotification(notificationId);
    };

    const getIcon = (type: string) => {
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
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                         <Badge variant="destructive" className="absolute top-0 right-0 h-5 w-5 justify-center p-0">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                        <React.Fragment key={notification.id}>
                            <DropdownMenuItem 
                                className="flex flex-col items-start gap-1 whitespace-normal cursor-pointer"
                                onSelect={() => handleNotificationClick(notification.id)}
                            >
                                <div className="flex items-center gap-2">
                                   {getIcon(notification.type)}
                                   <p className="font-semibold">{notification.title}</p>
                                </div>
                                <p className="pl-6 text-xs text-muted-foreground">{notification.description}</p>
                            </DropdownMenuItem>
                             {index < notifications.length - 1 && <DropdownMenuSeparator />}
                        </React.Fragment>
                    ))
                ) : (
                    <p className="p-2 text-center text-sm text-muted-foreground">No new notifications</p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
