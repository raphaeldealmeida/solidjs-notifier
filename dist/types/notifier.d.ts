import { JSX } from "solid-js";
import "virtual:windi.css";
export declare const ICONS: {
    bell: string;
};
export declare enum NotificationLevel {
    danger = "danger",
    warning = "warning",
    info = "info",
    success = "success"
}
export declare type TNotification = {
    id?: number;
    level: NotificationLevel;
    title?: string;
    plain?: string;
    html?: string;
    created?: Date;
    isToast?: boolean;
    seen?: boolean;
};
export declare abstract class AbstractNotification {
    id?: number;
    level: NotificationLevel;
    title?: string;
    abstract get someTitle(): string;
    plain?: string;
    html?: string;
    abstract get css(): string;
    created?: Date;
    isToast?: boolean;
    seen?: boolean;
}
export declare type TNotifProps = {
    store: {
        notifications: Array<TNotification>;
    };
    setNotifications: (arr: Array<TNotification>) => void;
};
export declare class Notification implements TNotification {
    id?: number;
    level: NotificationLevel;
    title?: string;
    plain?: string;
    html?: string;
    created?: Date;
    isToast?: boolean;
    seen?: boolean;
    static nextId: number;
    static speed: number;
    static min: number;
    constructor(arg: TNotification);
    static new(arg: TNotification): TNotification;
    get someTitle(): string;
    get css(): "bg-danger border-danger" | "bg-warning border-warning" | "bg-info border-info" | "bg-success border-success";
    get readingTime(): number;
}
/** A notification area. */
export declare class Notifier {
    private store;
    private setNotifications;
    readonly isOpen: () => boolean;
    private setIsOpen;
    readonly unreadFilter: () => boolean;
    private setUnreadFilter;
    private timer;
    constructor(props: TNotifProps);
    static new(props: TNotifProps): Notifier;
    private pleaseBind;
    addNotification(notification: TNotification): void;
    private setNotificationSeen;
    private nextQueuedToast;
    toggle(): void;
    toggleUnreadFilter(): void;
    show(): void;
    /** Hide the Notifier as long as the click was outside it. */
    private onDocClick;
    private hide;
    private onKeyDown;
    private onCheckbox;
    private onMarkSeen;
    private dismissToast;
    /** Return the number of notifications to be read. */
    get notSeen(): number;
    notSeenView(): Element;
    private oneNotificationView;
    private activeToastView;
    private activeModalView;
    view(): JSX.Element;
}
