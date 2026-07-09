"use client";

export function ContactForm() {
  return (
    <form
      className="rounded-sm border border-plum/10 bg-surface p-8 shadow-sm"
      onSubmit={(e) => e.preventDefault()}
    >
      <h2 className="font-display text-3xl text-plum">Send a message</h2>
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-sm border border-plum/15 px-4 py-2.5 text-sm text-foreground focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/30"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-sm border border-plum/15 px-4 py-2.5 text-sm text-foreground focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/30"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-foreground">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            className="mt-1 w-full rounded-sm border border-plum/15 px-4 py-2.5 text-sm text-foreground focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/30"
          >
            <option>General enquiry</option>
            <option>Class booking help</option>
            <option>Party booking</option>
            <option>Studio hire</option>
          </select>
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-foreground">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="mt-1 w-full rounded-sm border border-plum/15 px-4 py-2.5 text-sm text-foreground focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/30"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-sm bg-sage px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-sage-hover"
        >
          Send message
        </button>
      </div>
    </form>
  );
}
