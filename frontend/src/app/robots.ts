import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/api/",
                "/admin/",
                "/dashboard",
                "/settings",
                "/history",
                "/progress",
            ],
        },
        sitemap: "https://mierutone.com/sitemap.xml",
    };
}
