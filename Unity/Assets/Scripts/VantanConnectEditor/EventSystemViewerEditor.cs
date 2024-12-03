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
        for(int i=0; i<view.TestData.Count; ++i)
        {
            if (GUILayout.Button(@"イベント${(i+1)}実行"))
            {
                EventSystem.RunEvent(view.TestData[i]);
            }
        }
    }
}