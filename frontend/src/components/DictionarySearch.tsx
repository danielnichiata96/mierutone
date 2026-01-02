"use client";

import { useRouter } from "next/navigation";
import { QuickExamples } from "./QuickExamples";

export function DictionarySearch() {
    const router = useRouter();

    const handleSelect = (text: string) => {
        router.push(`/dict/${encodeURIComponent(text)}`);
    };

    return <QuickExamples onSelect={handleSelect} />;
}
