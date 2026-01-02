import { MetadataRoute } from "next";
import { seoWordList } from "@/data/seoWords";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://mierutone.com";

    const dictUrls = seoWordList.map((word) => ({
        url: `${baseUrl}/dict/${encodeURIComponent(word)}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        ...dictUrls,
        {
            url: `${baseUrl}/learn`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/learn/moras`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/learn/patterns`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/examples`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
    ];
}
