import { FormElementInstance } from "@/components/form-elements";

export type FormTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  elements: FormElementInstance[];
};

export const templates: FormTemplate[] = [
  {
    id: "contact",
    name: "Contact Form",
    description: "Name, email, and message fields for a standard contact page.",
    category: "Business",
    elements: [
      {
        id: "tpl-contact-title",
        type: "TitleField",
        extraAttributes: { title: "Contact Us" },
      },
      {
        id: "tpl-contact-name",
        type: "TextField",
        extraAttributes: { label: "Full Name", helperText: "", required: true, placeholder: "John Doe" },
      },
      {
        id: "tpl-contact-email",
        type: "EmailField",
        extraAttributes: { label: "Email", helperText: "", required: true, placeholder: "john@example.com" },
      },
      {
        id: "tpl-contact-message",
        type: "TextAreaField",
        extraAttributes: { label: "Message", helperText: "", required: true, placeholder: "Your message...", rows: 5 },
      },
    ],
  },
  {
    id: "feedback",
    name: "Feedback Form",
    description: "Rating scale and open-ended comments for collecting feedback.",
    category: "Business",
    elements: [
      {
        id: "tpl-feedback-title",
        type: "TitleField",
        extraAttributes: { title: "We Value Your Feedback" },
      },
      {
        id: "tpl-feedback-subtitle",
        type: "SubTitleField",
        extraAttributes: { title: "Tell us about your experience" },
      },
      {
        id: "tpl-feedback-rating",
        type: "RatingField",
        extraAttributes: { label: "Overall Rating", helperText: "", required: true, maxStars: 5 },
      },
      {
        id: "tpl-feedback-comments",
        type: "TextAreaField",
        extraAttributes: { label: "Comments", helperText: "", required: false, placeholder: "Share your thoughts...", rows: 4 },
      },
    ],
  },
  {
    id: "rsvp",
    name: "Event RSVP",
    description: "Collect attendee details and preferences for an event.",
    category: "Events",
    elements: [
      {
        id: "tpl-rsvp-title",
        type: "TitleField",
        extraAttributes: { title: "Event RSVP" },
      },
      {
        id: "tpl-rsvp-name",
        type: "TextField",
        extraAttributes: { label: "Full Name", helperText: "", required: true, placeholder: "Your name" },
      },
      {
        id: "tpl-rsvp-email",
        type: "EmailField",
        extraAttributes: { label: "Email", helperText: "", required: true, placeholder: "your@email.com" },
      },
      {
        id: "tpl-rsvp-guests",
        type: "NumberField",
        extraAttributes: { label: "Number of Guests", helperText: "", required: true, placeholder: "1", min: 1, max: 10, allowedDecimals: false },
      },
      {
        id: "tpl-rsvp-dietary",
        type: "TextAreaField",
        extraAttributes: { label: "Dietary Requirements", helperText: "", required: false, placeholder: "Any dietary restrictions?", rows: 3 },
      },
    ],
  },
];
// ponytail: static JSON templates; DB-backed system if users contribute templates at scale
