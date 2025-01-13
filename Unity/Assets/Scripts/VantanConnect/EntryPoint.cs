using UnityEngine;

public class EntryPoint
{
    /// <summary>
    /// ƒQ[ƒ€ŠJn‚ÉŒÄ‚Î‚ê‚é
    /// </summary>
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Run()
    {
        Debug.Log("Setup");
        GameObject obj = new GameObject("VCMain");
        obj.AddComponent<WebSocketEventManager>();
        obj.AddComponent<EventSystemViewer>();
        GameObject.DontDestroyOnLoad(obj);
    }
}