using UnityEngine;
using System.Collections.Generic;
using VTNConnect;
using Cysharp.Threading.Tasks;

/// <summary>
/// イベント管理クラス
/// </summary>
public class EventReceiver : MonoBehaviour
{
    [SerializeField] GameObject _root;
    [SerializeField] GameObject _prefab;

    private void Awake()
    {
        EventSystem.AddListener(OnEventCall);
    }

    void OnEventCall(EventData data)
    {
        if (data.EventId == 1)
        {
            var go = GameObject.Instantiate(_prefab, _root.transform);
            go.transform.position = new Vector3(Random.Range(0, 1920), Random.Range(0, 1080), 0);
        }
    }
}
