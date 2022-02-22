import { createSignal, For, Show } from "solid-js";
import { Transition } from "solid-transition-group";
//import { CloseButton } from "../widgets/close-button"
import "virtual:windi.css";
export const ICONS = {
    bell: `<svg width="16" height="16" viewBox="0 0 16 16"
		fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M8 16a2 2 0 002-2H6a2 2 0 002 2zm.995-14.901a1 1 0 10-1.99 0A5.002 5.002 0 003 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
		</svg>`
};
export var NotificationLevel;
(function (NotificationLevel) {
    NotificationLevel["danger"] = "danger";
    NotificationLevel["warning"] = "warning";
    NotificationLevel["info"] = "info";
    NotificationLevel["success"] = "success";
})(NotificationLevel || (NotificationLevel = {}));
export class AbstractNotification {
    id;
    level;
    title = "";
    plain = "";
    html = "";
    created;
    isToast = true;
    seen = false;
}
export class Notification {
    id;
    level;
    title = "";
    plain = "";
    html = "";
    created;
    isToast = true;
    seen = false;
    static nextId = 0;
    static speed = 90; // Takes one second to read 11 chars
    static min = 3000; // but the minimum is 3 seconds
    constructor(arg) {
        Object.assign(this, arg);
        if (!this.created)
            this.created = new Date();
        this.id = ++Notification.nextId;
    }
    static new(arg) {
        return new this(arg);
    }
    get someTitle() {
        return this.title || (this.level).charAt(0).toUpperCase() + (this.level).slice(1);
    }
    get css() {
        switch (this.level) {
            case "danger":
                return "bg-danger border-danger";
            case "warning":
                return "bg-warning border-warning";
            case "info":
                return "bg-info border-info";
            case "success":
                return "bg-success border-success";
            default:
                throw new Error(`Unexpected notification level: "${this.level}"`);
        }
    }
    get readingTime() {
        // Estimate the time one takes to read some text
        let len = 0;
        if (this.title)
            len += this.title.length;
        if (this.html)
            len += this.html.length;
        if (this.plain)
            len += this.plain.length;
        const duration = len * Notification.speed;
        if (duration < Notification.min)
            return Notification.min;
        else
            return duration;
    }
}
const [queueToast, setQueueToast] = createSignal([]);
const [activeModal, setActiveModal] = createSignal(null);
const [activeToast, setActiveToast] = createSignal(null);
/** A notification area. */
export class Notifier {
    store;
    setNotifications;
    isOpen;
    setIsOpen;
    unreadFilter;
    setUnreadFilter;
    timer = null;
    constructor(props) {
        this.store = props.store;
        this.setNotifications = props.setNotifications;
        [this.isOpen, this.setIsOpen] = createSignal(false);
        [this.unreadFilter, this.setUnreadFilter] = createSignal(false);
        this.pleaseBind(this, [
            "onDocClick", "hide", "onKeyDown", "onCheckbox", "onMarkSeen",
            "oneNotificationView", "activeToastView", "nextQueuedToast",
            "view", "dismissToast", "toggleUnreadFilter",
        ]);
    }
    static new(props) {
        return Object.seal(new this(props));
    }
    pleaseBind(component, names) {
        // *names* is passed in but we keep only the methods.
        const methods = names.filter(name => typeof component[name] === "function");
        for (const method of methods) {
            component[method] = component[method].bind(component);
        }
    }
    addNotification(notification) {
        const list = Array.from(this.store.notifications);
        if (notification.isToast) {
            notification.seen = true;
            setActiveModal(notification);
        }
        else {
            setQueueToast([...queueToast(), notification]);
            if (!activeToast())
                this.nextQueuedToast();
        }
        list.unshift(notification);
        this.setNotifications(list);
    }
    setNotificationSeen(notifications, id, seen) {
        const old = notifications.find(n => n.id === id);
        const ntf = Notification.new(old);
        ntf.seen = seen;
        return Array.from(notifications, (x) => x === old ? ntf : x);
    }
    nextQueuedToast() {
        let queue = queueToast();
        let toast = queue.shift();
        setActiveToast(toast);
        if (!activeToast())
            return false;
        this.timer = setTimeout(this.nextQueuedToast, toast.readingTime);
        setQueueToast(queue);
    }
    toggle() {
        if (this.isOpen())
            this.hide();
        else
            this.show();
    }
    toggleUnreadFilter() {
        this.setUnreadFilter(!this.unreadFilter());
    }
    show() {
        setQueueToast([]);
        this.dismissToast();
        this.setIsOpen(true);
        document.addEventListener("click", this.onDocClick);
        document.addEventListener("keydown", this.onKeyDown);
    }
    /** Hide the Notifier as long as the click was outside it. */
    onDocClick(ev) {
        const notifierDiv = document.querySelector("#notifier");
        if (notifierDiv === ev.target
            || notifierDiv.contains(ev.target)) {
            return; // since clicked inside the div
        }
        else {
            this.hide();
        }
    }
    hide() {
        this.setIsOpen(false);
        document.removeEventListener("click", this.onDocClick);
        document.removeEventListener("keydown", this.onKeyDown);
    }
    onKeyDown(ev) {
        if (ev.key == "Escape")
            this.hide();
    }
    onCheckbox(ev) {
        const checkbox = ev.target;
        const id = parseInt(checkbox.dataset.id);
        this.setNotifications(this.setNotificationSeen(this.store.notifications, id, checkbox.checked));
    }
    onMarkSeen(ev) {
        const checkbox = ev.target;
        const id = parseInt(checkbox.dataset.id);
        this.setNotifications(this.setNotificationSeen(this.store.notifications, id, true));
        this.dismissToast();
    }
    dismissToast() {
        setActiveToast(null);
        clearTimeout(this.timer);
        this.nextQueuedToast();
    }
    /** Return the number of notifications to be read. */
    get notSeen() {
        let notSeen = 0;
        for (const notif of this.store.notifications) {
            if (!notif.seen)
                ++notSeen;
        }
        return notSeen;
    }
    notSeenView() {
        const notSeen = this.notSeen;
        const bg = notSeen ? "bg-unread" : "bg-gray";
        return <small title={notSeen.toString() + " not seen"} class={"px-1 rounded-full text-light-200 " + bg}>{notSeen}</small>;
    }
    oneNotificationView(entry) {
        const self = this;
        return <Show when={this.unreadFilter() ? !entry.seen : true}>
			<div class={"p-2 my-2 rounded border border-popover " +
                (entry.seen ? "bg-opacity-30 " : "") + entry.css}>
				<label class="text-lg" title={entry.seen ? "seen" : "not seen"}>
					<input type="checkbox" data-id={entry.id} checked={entry.seen} onChange={self.onCheckbox}/>&nbsp;
					<span class="border-b">{entry.someTitle}</span>
				</label>
				<div class="p-1" innerHTML={entry.html || entry.plain}></div>
				<p class="text-xs">{entry.created.toLocaleString()}</p>
			</div>
		</Show>;
    }
    activeToastView(entry) {
        const self = this;
        return (<div class="top-5 right-0 fixed z-50 w-full md:max-w-sm p-4 md:p-4 max-h-screen overflow-hidden pointer-events-none">
				<div class="flex-1 flex-col fade w-full mr-8 justify-end pointer-events-none">
					<div class="flex py-1 w-full transform transition-all duration-300 pointer-events-auto">
						<div class={"flex w-full visible flex-row shadow-lg border-l-4 rounded-md duration-100 cursor-pointer transform transition-all hover:scale-102 bg-" + entry.level}>
							<div class="flex flex-row p-2 flex-no-wrap w-full">
								<div class="flex flex-col flex-no-wrap px-1 w-full">
									<div class="flex my-auto font-bold select-none" data-id={entry.id} onClick={self.onMarkSeen}>
										{entry.someTitle}
									</div>
									<p class="mt-1 my-auto flex text-gray-700 text-sm truncate-1-lines" innerHTML={entry.html || entry.plain} data-id={entry.id} onClick={self.onMarkSeen}/>
								</div>
								<div class="w-5 h-5 mr-2 items-center mx-auto text-center leading-none">
									<button class="text-xs underline text-gray-800" data-id={entry.id} onClick={self.dismissToast}>
										Later
									</button>
								</div>
								&nbsp&nbsp
								<div class="w-5 h-5 mr-2 items-center mx-auto text-center leading-none">
									<button class="text-xs underline text-gray-800" data-id={entry.id} onClick={self.onMarkSeen}>
										Seen
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>);
    }
    activeModalView(entry) {
        const self = this;
        return (<div class="fixed flex items-center justify-center overflow-auto z-50 bg-gray bg-opacity-40 left-0 right-0 top-0 bottom-0">
				<div class="bg-normal rounded-xl shadow-2xl p-6 sm:w-10/12 mx-10">
					<span class="font-bold block text-2xl mb-3">{entry.someTitle}</span>
					<div class="p-1" innerHTML={entry.html || entry.plain}></div>

					<div class="text-right space-x-5 mt-5">
						<button onClick={() => { setActiveModal(null); }} class="px-4 py-2 text-sm bg-white rounded-xl border transition-colors duration-150 ease-linear border-gray-200 focus:outline-none focus:ring-0 font-bold hover:bg-gray-50 focus:bg-indigo-50 focus:text-indigo">Okay</button>
					</div>
				</div>
			</div>);
    }
    view() {
        return <>
			<Show when={activeModal()}>
				{this.activeModalView(activeModal())}
			</Show>
			<Transition onBeforeEnter={(el) => (el.style.opacity = "0")} onEnter={(el, done) => {
                const a = el.animate([{ opacity: 0, top: '5rem' }, { opacity: 1, top: '1.25rem' }], {
                    duration: 500
                });
                a.finished.then(done);
            }} onAfterEnter={(el) => (el.style.opacity = "1")} onExit={(el, done) => {
                const a = el.animate([{ opacity: 1, top: '1.25rem' }, { opacity: 0, top: 0 }], {
                    duration: 300
                });
                a.finished.then(done);
            }}>
				<Show when={activeToast()}>
					{this.activeToastView(activeToast())}
				</Show>
			</Transition>
			<Show when={this.isOpen()}>
				<div id="notifier" class="fixed right-0 min-w-1/3 max-w-sm p-3 rounded border border-popover bg-popover overflow-y-auto h-4/5 z-50 shadow-xl">
					{/* <CloseButton onClick={this.hide} /> */}
					<h1 class="text-xl">
						<span class="inline-block" innerHTML={ICONS.bell}/>
						&nbsp; Notifications
						<small class="ml-2">{this.notSeenView()}</small>
					</h1>
					<hr />
					<p>
						<button onClick={this.toggleUnreadFilter} class="text-xs underline text-gray-800 focus:outline-none" title={this.unreadFilter() ? "Currently showing subset" : "Currently showing all notifications"}>{this.unreadFilter() ? 'View all' : 'Filter by unread'}
						</button>
					</p>
					<For each={this.store.notifications}>{this.oneNotificationView}</For>
				</div>
			</Show>
		</>;
    }
}
