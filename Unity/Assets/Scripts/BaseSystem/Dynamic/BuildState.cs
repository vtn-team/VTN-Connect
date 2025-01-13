
public class BuildState
{
    const string _hash = "47a9e22f-5107-45d4-a8eb-a2d143303a23";
    const string _project = "VTNConnect";
    public const string Version = "0.1.1";

    public static string BuildHash
    {
        get
        {
#if UNITY_EDITOR
            return "UNITY_EDITOR";
#else
            return _hash;
#endif
        }
    }
};