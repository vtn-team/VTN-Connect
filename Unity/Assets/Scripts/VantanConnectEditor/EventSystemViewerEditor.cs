using UnityEngine;
using UnityEditor;
using VTNConnect;

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
    }
}