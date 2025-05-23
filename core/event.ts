export class EventManager {
    private static events: { event: string, func: Function, once: boolean }[] = []
    public static on(event: string, func: (...args: any[]) => any) {
        this.events.push({ event, func, once: false })
    }
    public static once(event: string, func: (...args: any[]) => any) {
        this.events.push({ event, func, once: true })
    }
    public static emit(event: string, ...args: any[]) {
        setTimeout(() => {
            const matchingEvents = this.events.filter(e => e.event === event)
            for (const e of matchingEvents) (async () => await e.func(...args))()
            this.events = this.events.filter(e => !(e.event === event && e.once))
        }, -1)
    }
    public static clear(event?: string) {
        if (event) this.events = this.events.filter(e => e.event !== event)
        else this.events = []
    }
}