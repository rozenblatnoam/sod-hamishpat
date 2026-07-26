export declare class VideosController {
    private s3;
    getSignedUrl(filename: string): Promise<{
        url: string;
    }>;
}
