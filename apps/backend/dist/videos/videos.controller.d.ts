export declare class VideosController {
    private s3;
    getSignedUrl(filename: string): Promise<{
        error: string;
        url?: undefined;
    } | {
        url: string;
        error?: undefined;
    }>;
}
