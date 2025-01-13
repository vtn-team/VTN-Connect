using UnityEngine;

public class EntryPoint
{
    /// <summary>
    /// ゲーム開始時に呼ばれる
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