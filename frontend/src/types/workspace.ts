export interface WhatsappNumber {
  _id: string;
  number: string;
  text?: string;
  isActive: boolean;
}

export interface Workspace {
  _id: string;
  name: string;
  customUrl: string;
  utmParameters?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}
