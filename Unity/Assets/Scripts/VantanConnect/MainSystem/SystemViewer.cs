using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

namespace VTNConnect
{
    /// <summary>
    /// インスペクタ情報表示用クラス
    /// </summary>
    public class SystemViewer : MonoBehaviour
    {
        [SerializeField] EventData _testData;

        void Update()
        {
            if (Input.GetKeyDown(KeyCode.Space))
            {
                var n = new EventData(EventDefine.Cheer);
                n.DataPack<float>("X", this.transform.position.x);
                n.DataPack("Pos", this.transform.position);
                n.DataPack("Rot", this.transform.rotation);
                VantanConnect.SendEvent(n);
            }
        }

#if UNITY_EDITOR
        public EventData TestData => _testData;
#endif
    }
}