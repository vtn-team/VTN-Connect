namespace VTNConnect
{
    /// <summary>
    /// 環境系DI用のインタフェース
    /// </summary>
    public interface IEnvironment
    {
        public string APIServerURI { get; }
    }
}