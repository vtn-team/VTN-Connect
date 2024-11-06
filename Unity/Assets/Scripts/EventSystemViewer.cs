using UnityEngine;
using System.Collections.Generic;
using VTNConnect;


/// <summary>
/// イベント管理クラス
/// </summary>
public class EventSystemViewer : MonoBehaviour
{
    [SerializeField, SerializeReference, SubclassSelector] List<EventData> _testData;

    //test
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            NecoEvent n = new NecoEvent();
            n.DataPack<float>("X", this.transform.position.x);
            n.DataPack("Pos", this.transform.position);
            n.DataPack("Rot", this.transform.rotation);
            n.Send();
        }
    }

#if UNITY_EDITOR
    public List<EventData> TestData => _testData;
#endif
}
