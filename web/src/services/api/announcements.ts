import { apiGet } from "@/services/api/request";

export type Announcement = {
    id: string;
    title: string;
    content: string;
    enabled: boolean;
    priority: number;
    startAt: string;
    endAt: string;
    buttonText: string;
    buttonUrl: string;
    createdAt: string;
    updatedAt: string;
};

export async function fetchActiveAnnouncement() {
    return apiGet<Announcement | null>("/api/announcements/active");
}
