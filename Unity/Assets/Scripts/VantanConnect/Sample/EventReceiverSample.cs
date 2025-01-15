using UnityEngine;

namespace VTNConnect
{
    /// <summary>
    /// イベント受け取りクラスサンプル
    /// </summary>
    public class EventReceiverSample : MonoBehaviour, IVantanConnectEventReceiver
    {
        [SerializeField] GameObject _root;
        [SerializeField] GameObject _prefab;

        bool _isActive = true;
        public bool IsActive => _isActive;

        private void Awake()
        {
            VantanConnect.RegisterEventReceiver(this);
        }

        public void OnEventCall(EventData data)
        {
            switch(data.EventCode)
            {
                case EventDefine.Cheer:
                    var go = GameObject.Instantiate(_prefab, _root.transform);
                    go.transform.position = new Vector3(Random.Range(0, 1920), Random.Range(0, 1080), 0);
                    break;
            }
        }
    }
}