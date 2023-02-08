export default abstract class ImageGenerator<Options> {
    public abstract generate(options: Options): Promise<Blob>;
}
