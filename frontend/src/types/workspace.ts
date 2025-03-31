export interface WhatsappNumber {
  _id: string;
  number: string;
  text?: string;
  isActive: boolean;
}

interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface Visitor {
  visitorId: string;
  ip: string;
  userAgent: string;
  visitCount: number;
}

interface AccessDetail {
  deviceType: "mobile" | "desktop";
  ipAddress: string;
  visitorId: string;
}

export interface Workspace {
  _id: string;
  name: string;
  customUrl: string;
  utmParameters?: UTMParameters;
  accessCount: number;
  desktopAccessCount: number;
  mobileAccessCount: number;
  visitors: Visitor[];
  accessDetails: AccessDetail[];
}
