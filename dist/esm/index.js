import { template, delegateEvents, insert, effect, setAttribute, createComponent, addEventListener } from 'solid-js/web';
import { createSignal, Show, For } from 'solid-js';
import { Transition } from 'solid-transition-group';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const _tmpl$ = template(`<small></small>`, 2),
      _tmpl$2 = template(`<div><label class="text-lg"><input type="checkbox">&nbsp;<span class="border-b"></span></label><div class="p-1"></div><p class="text-xs"></p></div>`, 11),
      _tmpl$3 = template(`<div class="top-5 right-0 fixed z-50 w-full md:max-w-sm p-4 md:p-4 max-h-screen overflow-hidden pointer-events-none"><div class="flex-1 flex-col fade w-full mr-8 justify-end pointer-events-none"><div class="flex py-1 w-full transform transition-all duration-300 pointer-events-auto"><div><div class="flex flex-row p-2 flex-no-wrap w-full"><div class="flex flex-col flex-no-wrap px-1 w-full"><div class="flex my-auto font-bold select-none"></div><p class="mt-1 my-auto flex text-gray-700 text-sm truncate-1-lines"></p></div><div class="w-5 h-5 mr-2 items-center mx-auto text-center leading-none"><button class="text-xs underline text-gray-800">Later</button></div>&nbsp&nbsp<div class="w-5 h-5 mr-2 items-center mx-auto text-center leading-none"><button class="text-xs underline text-gray-800">Seen</button></div></div></div></div></div></div>`, 24),
      _tmpl$4 = template(`<div class="fixed flex items-center justify-center overflow-auto z-50 bg-gray bg-opacity-40 left-0 right-0 top-0 bottom-0"><div class="bg-normal rounded-xl shadow-2xl p-6 sm:w-10/12 mx-10"><span class="font-bold block text-2xl mb-3"></span><div class="p-1"></div><div class="text-right space-x-5 mt-5"><button class="px-4 py-2 text-sm bg-white rounded-xl border transition-colors duration-150 ease-linear border-gray-200 focus:outline-none focus:ring-0 font-bold hover:bg-gray-50 focus:bg-indigo-50 focus:text-indigo">Okay</button></div></div></div>`, 12),
      _tmpl$5 = template(`<div id="notifier" class="fixed right-0 min-w-1/3 max-w-sm p-3 rounded border border-popover bg-popover overflow-y-auto h-4/5 z-50 shadow-xl"><h1 class="text-xl"><span class="inline-block"></span>&nbsp; Notifications<small class="ml-2"></small></h1><hr><p><button class="text-xs underline text-gray-800 focus:outline-none"></button></p></div>`, 13);
const ICONS = {
  bell: `<svg width="16" height="16" viewBox="0 0 16 16"
		fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M8 16a2 2 0 002-2H6a2 2 0 002 2zm.995-14.901a1 1 0 10-1.99 0A5.002 5.002 0 003 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
		</svg>`
};
let NotificationLevel;

(function (NotificationLevel) {
  NotificationLevel["danger"] = "danger";
  NotificationLevel["warning"] = "warning";
  NotificationLevel["info"] = "info";
  NotificationLevel["success"] = "success";
})(NotificationLevel || (NotificationLevel = {}));

class AbstractNotification {
  constructor() {
    _defineProperty(this, "id", void 0);

    _defineProperty(this, "level", void 0);

    _defineProperty(this, "title", "");

    _defineProperty(this, "plain", "");

    _defineProperty(this, "html", "");

    _defineProperty(this, "created", void 0);

    _defineProperty(this, "isToast", true);

    _defineProperty(this, "seen", false);
  }

}
class Notification {
  // Takes one second to read 11 chars
  // but the minimum is 3 seconds
  constructor(arg) {
    _defineProperty(this, "id", void 0);

    _defineProperty(this, "level", void 0);

    _defineProperty(this, "title", "");

    _defineProperty(this, "plain", "");

    _defineProperty(this, "html", "");

    _defineProperty(this, "created", void 0);

    _defineProperty(this, "isToast", true);

    _defineProperty(this, "seen", false);

    Object.assign(this, arg);
    if (!this.created) this.created = new Date();
    this.id = ++Notification.nextId;
  }

  static new(arg) {
    return new this(arg);
  }

  get someTitle() {
    return this.title || this.level.charAt(0).toUpperCase() + this.level.slice(1);
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
    if (this.title) len += this.title.length;
    if (this.html) len += this.html.length;
    if (this.plain) len += this.plain.length;
    const duration = len * Notification.speed;
    if (duration < Notification.min) return Notification.min;else return duration;
  }

}

_defineProperty(Notification, "nextId", 0);

_defineProperty(Notification, "speed", 90);

_defineProperty(Notification, "min", 3000);

const [queueToast, setQueueToast] = createSignal([]);
const [activeModal, setActiveModal] = createSignal(null);
const [activeToast, setActiveToast] = createSignal(null);
/** A notification area. */

class Notifier {
  constructor(props) {
    _defineProperty(this, "store", void 0);

    _defineProperty(this, "setNotifications", void 0);

    _defineProperty(this, "isOpen", void 0);

    _defineProperty(this, "setIsOpen", void 0);

    _defineProperty(this, "unreadFilter", void 0);

    _defineProperty(this, "setUnreadFilter", void 0);

    _defineProperty(this, "timer", null);

    this.store = props.store;
    this.setNotifications = props.setNotifications;
    [this.isOpen, this.setIsOpen] = createSignal(false);
    [this.unreadFilter, this.setUnreadFilter] = createSignal(false);
    this.pleaseBind(this, [// prevent problems with event handlers
    "onDocClick", "hide", "onKeyDown", "onCheckbox", "onMarkSeen", "oneNotificationView", "activeToastView", "nextQueuedToast", "view", "dismissToast", "toggleUnreadFilter"]);
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
    } else {
      setQueueToast([...queueToast(), notification]);
      if (!activeToast()) this.nextQueuedToast();
    }

    list.unshift(notification);
    this.setNotifications(list);
  }

  setNotificationSeen(notifications, id, seen) {
    const old = notifications.find(n => n.id === id);
    const ntf = Notification.new(old);
    ntf.seen = seen;
    return Array.from(notifications, x => x === old ? ntf : x);
  }

  nextQueuedToast() {
    let queue = queueToast();
    let toast = queue.shift();
    setActiveToast(toast);
    if (!activeToast()) return false;
    this.timer = setTimeout(this.nextQueuedToast, toast.readingTime);
    setQueueToast(queue);
  }

  toggle() {
    if (this.isOpen()) this.hide();else this.show();
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

    if (notifierDiv === ev.target || notifierDiv.contains(ev.target)) {
      return; // since clicked inside the div
    } else {
      this.hide();
    }
  }

  hide() {
    this.setIsOpen(false);
    document.removeEventListener("click", this.onDocClick);
    document.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown(ev) {
    if (ev.key == "Escape") this.hide();
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
      if (!notif.seen) ++notSeen;
    }

    return notSeen;
  }

  notSeenView() {
    const notSeen = this.notSeen;
    const bg = notSeen ? "bg-unread" : "bg-gray";
    return (() => {
      const _el$ = _tmpl$.cloneNode(true);

      _el$.className = "px-1 rounded-full text-light-200 " + bg;

      insert(_el$, notSeen);

      effect(() => setAttribute(_el$, "title", notSeen.toString() + " not seen"));

      return _el$;
    })();
  }

  oneNotificationView(entry) {
    const self = this;

    const _self$ = this;

    return createComponent(Show, {
      get when() {
        return _self$.unreadFilter() ? !entry.seen : true;
      },

      get children() {
        const _el$2 = _tmpl$2.cloneNode(true),
              _el$3 = _el$2.firstChild,
              _el$4 = _el$3.firstChild,
              _el$5 = _el$4.nextSibling,
              _el$6 = _el$5.nextSibling,
              _el$7 = _el$3.nextSibling,
              _el$8 = _el$7.nextSibling;

        addEventListener(_el$4, "change", self.onCheckbox);

        insert(_el$6, () => entry.someTitle);

        insert(_el$8, () => entry.created.toLocaleString());

        effect(_p$ => {
          const _v$ = "p-2 my-2 rounded border border-popover " + (entry.seen ? "bg-opacity-30 " : "") + entry.css,
                _v$2 = entry.seen ? "seen" : "not seen",
                _v$3 = entry.id,
                _v$4 = entry.seen,
                _v$5 = entry.html || entry.plain;

          _v$ !== _p$._v$ && (_el$2.className = _p$._v$ = _v$);
          _v$2 !== _p$._v$2 && setAttribute(_el$3, "title", _p$._v$2 = _v$2);
          _v$3 !== _p$._v$3 && setAttribute(_el$4, "data-id", _p$._v$3 = _v$3);
          _v$4 !== _p$._v$4 && (_el$4.checked = _p$._v$4 = _v$4);
          _v$5 !== _p$._v$5 && (_el$7.innerHTML = _p$._v$5 = _v$5);
          return _p$;
        }, {
          _v$: undefined,
          _v$2: undefined,
          _v$3: undefined,
          _v$4: undefined,
          _v$5: undefined
        });

        return _el$2;
      }

    });
  }

  activeToastView(entry) {
    const self = this;
    return (() => {
      const _el$9 = _tmpl$3.cloneNode(true),
            _el$10 = _el$9.firstChild,
            _el$11 = _el$10.firstChild,
            _el$12 = _el$11.firstChild,
            _el$13 = _el$12.firstChild,
            _el$14 = _el$13.firstChild,
            _el$15 = _el$14.firstChild,
            _el$16 = _el$15.nextSibling,
            _el$17 = _el$14.nextSibling,
            _el$18 = _el$17.firstChild,
            _el$19 = _el$17.nextSibling,
            _el$20 = _el$19.nextSibling,
            _el$21 = _el$20.firstChild;

      addEventListener(_el$15, "click", self.onMarkSeen, true);

      insert(_el$15, () => entry.someTitle);

      addEventListener(_el$16, "click", self.onMarkSeen, true);

      addEventListener(_el$18, "click", self.dismissToast, true);

      addEventListener(_el$21, "click", self.onMarkSeen, true);

      effect(_p$ => {
        const _v$6 = "flex w-full visible flex-row shadow-lg border-l-4 rounded-md duration-100 cursor-pointer transform transition-all hover:scale-102 bg-" + entry.level,
              _v$7 = entry.id,
              _v$8 = entry.html || entry.plain,
              _v$9 = entry.id,
              _v$10 = entry.id,
              _v$11 = entry.id;

        _v$6 !== _p$._v$6 && (_el$12.className = _p$._v$6 = _v$6);
        _v$7 !== _p$._v$7 && setAttribute(_el$15, "data-id", _p$._v$7 = _v$7);
        _v$8 !== _p$._v$8 && (_el$16.innerHTML = _p$._v$8 = _v$8);
        _v$9 !== _p$._v$9 && setAttribute(_el$16, "data-id", _p$._v$9 = _v$9);
        _v$10 !== _p$._v$10 && setAttribute(_el$18, "data-id", _p$._v$10 = _v$10);
        _v$11 !== _p$._v$11 && setAttribute(_el$21, "data-id", _p$._v$11 = _v$11);
        return _p$;
      }, {
        _v$6: undefined,
        _v$7: undefined,
        _v$8: undefined,
        _v$9: undefined,
        _v$10: undefined,
        _v$11: undefined
      });

      return _el$9;
    })();
  }

  activeModalView(entry) {
    return (() => {
      const _el$22 = _tmpl$4.cloneNode(true),
            _el$23 = _el$22.firstChild,
            _el$24 = _el$23.firstChild,
            _el$25 = _el$24.nextSibling,
            _el$26 = _el$25.nextSibling,
            _el$27 = _el$26.firstChild;

      insert(_el$24, () => entry.someTitle);

      _el$27.$$click = () => {
        setActiveModal(null);
      };

      effect(() => _el$25.innerHTML = entry.html || entry.plain);

      return _el$22;
    })();
  }

  view() {
    const _self$2 = this;

    return [createComponent(Show, {
      get when() {
        return activeModal();
      },

      get children() {
        return _self$2.activeModalView(activeModal());
      }

    }), createComponent(Transition, {
      onBeforeEnter: el => el.style.opacity = "0",
      onEnter: (el, done) => {
        const a = el.animate([{
          opacity: 0,
          top: '5rem'
        }, {
          opacity: 1,
          top: '1.25rem'
        }], {
          duration: 500
        });
        a.finished.then(done);
      },
      onAfterEnter: el => el.style.opacity = "1",
      onExit: (el, done) => {
        const a = el.animate([{
          opacity: 1,
          top: '1.25rem'
        }, {
          opacity: 0,
          top: 0
        }], {
          duration: 300
        });
        a.finished.then(done);
      },

      get children() {
        return createComponent(Show, {
          get when() {
            return activeToast();
          },

          get children() {
            return _self$2.activeToastView(activeToast());
          }

        });
      }

    }), createComponent(Show, {
      get when() {
        return _self$2.isOpen();
      },

      get children() {
        const _el$28 = _tmpl$5.cloneNode(true),
              _el$29 = _el$28.firstChild,
              _el$30 = _el$29.firstChild,
              _el$31 = _el$30.nextSibling,
              _el$32 = _el$31.nextSibling,
              _el$33 = _el$29.nextSibling,
              _el$34 = _el$33.nextSibling,
              _el$35 = _el$34.firstChild;

        insert(_el$32, () => _self$2.notSeenView());

        addEventListener(_el$35, "click", _self$2.toggleUnreadFilter, true);

        insert(_el$35, () => _self$2.unreadFilter() ? 'View all' : 'Filter by unread');

        insert(_el$28, createComponent(For, {
          get each() {
            return _self$2.store.notifications;
          },

          get children() {
            return _self$2.oneNotificationView;
          }

        }), null);

        effect(_p$ => {
          const _v$12 = ICONS.bell,
                _v$13 = _self$2.unreadFilter() ? "Currently showing subset" : "Currently showing all notifications";

          _v$12 !== _p$._v$12 && (_el$30.innerHTML = _p$._v$12 = _v$12);
          _v$13 !== _p$._v$13 && setAttribute(_el$35, "title", _p$._v$13 = _v$13);
          return _p$;
        }, {
          _v$12: undefined,
          _v$13: undefined
        });

        return _el$28;
      }

    })];
  }

}

delegateEvents(["click"]);

export { AbstractNotification, Notification, NotificationLevel, Notifier };
//# sourceMappingURL=index.js.map
