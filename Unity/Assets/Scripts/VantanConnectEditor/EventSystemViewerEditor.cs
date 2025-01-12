using UnityEngine;
using UnityEditor;
using VTNConnect;
using Cysharp.Threading.Tasks;

/// <summary>
/// シーン依存系設定のエディタ拡張
/// </summary>
[CustomEditor(typeof(EventSystemViewer), true, isFallback = true)]
public class EventSystemViewerEditor : Editor
{
    /// <summary>
    /// インスペクタ上で設定
    /// </summary>
    public override void OnInspectorGUI()
    {
        base.OnInspectorGUI();

        EventSystemViewer view = target as EventSystemViewer;
        if (view.TestData == null) return;
        if (GUILayout.Button(@"オリジナルイベント送信"))
        {
            EventSystem.SendEvent(view.TestData.EventId, view.TestData);
        }
        if (GUILayout.Button(@"オリジナルイベント実行"))
        {
            EventSystem.RunEvent(view.TestData);
        }
        GUILayout.Space(50);

        if (GUILayout.Button(@"API: GetAddress実行"))
        {
            UniTask.RunOnThreadPool(async () =>
            {
                Debug.Log(await GameAPI.GetAddress());
            }).Forget();
        }

        if (GUILayout.Button(@"API: GameStart実行"))
        {
            UniTask.RunOnThreadPool(async () =>
            {
                Debug.Log(await GameAPI.GameStart());
            }).Forget();
        }

        if (GUILayout.Button(@"API: GameEnd実行"))
        {
            UniTask.RunOnThreadPool(async () =>
            {
                Debug.Log(await GameAPI.GameEnd(true));
            }).Forget();
        }


        if (GUILayout.Button(@"API: (AIGAME)GameStart実行"))
        {
            UniTask.RunOnThreadPool(async () =>
            {
                Debug.Log(await GameAPI.GameStartAIGame());
            }).Forget();
        }

        if (GUILayout.Button(@"API: (AIGAME)GameEnd実行"))
        {
            UniTask.RunOnThreadPool(async () =>
            {
                Debug.Log(await GameAPI.GameEndAIGame());
            }).Forget();
        }
    }
}