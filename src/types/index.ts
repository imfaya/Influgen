// TypeScript types for InfluGen Studio

// Content generation mode
export type ContentMode = 'social' | 'sensual' | 'porn';

export interface Influencer {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    avatar: string;
    basePrompt: string;
    defaultReferenceImages?: string[];
    llmSystemPrompt?: string;
}

export interface PendingGeneration {
    id: string;
    prompt: string;
    contentMode: ContentMode;
    startedAt: string;
    // For series grouping - track which generation this continuation belongs to
    sourceGenerationId?: string;
    sourceImageUrl?: string;
    // For batch shoot grouping - all items with same batchId are shown together
    batchId?: string;
    tags?: string[];
}

export interface GenerationParameters {
    numOutputs: 1 | 2 | 4 | 8;
    aspectRatio: AspectRatio;
    resolution: string;
    model: string;
    isMaxResolution: boolean;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface AspectRatioOption {
    value: AspectRatio;
    label: string;
    width: number;
    height: number;
}

export interface GenerationRequest {
    model: string;
    prompt: string;
    negative_prompt?: string;
    num_outputs: 1 | 2 | 4 | 8;
    aspect_ratio: AspectRatio;
    resolution: string;
    reference_images?: string[];
}

export interface Generation {
    id: string;
    influencer_name: string;
    prompt: string;
    parameters: GenerationParameters;
    image_urls: string[];
    is_series: boolean;
    series_id?: string;
    created_at: string;
    content_mode?: ContentMode; // Track which mode was used for generation
    tags?: string[]; // Optional tags for filtering/detecting generation context (e.g. 'quick_post')
    caption?: string;
    hashtags?: string[];
}


export interface ReferenceImage {
    id: string;
    influencer_name: string;
    image_url: string;
    image_type: 'face' | 'edit';
    uploaded_at: string;
}

export interface GenerationState {
    isLoading: boolean;
    error: string | null;
    currentImages: string[];
    seriesId: string | null;
    seriesContext: {
        location?: string;
        outfit?: string;
        lighting?: string;
    } | null;
}

export interface RandomPromptElements {
    locations: string[];
    actions: string[];
    styles: string[];
    lighting: string[];
}

// Post ready to be published
export interface Post {
    id: string;
    influencer_id: string;
    influencer_name: string;
    image_url: string;
    prompt: string; // The prompt used to generate the image
    caption: string;
    hashtags: string[];
    content_mode: ContentMode;
    status: 'generating' | 'draft' | 'ready' | 'posted';
    created_at: string;
    scheduled_at?: string;
}
