using UnityEngine;

public class EntryPoint
{
    /// <summary>
    /// �Q�[���J�n���ɌĂ΂��
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