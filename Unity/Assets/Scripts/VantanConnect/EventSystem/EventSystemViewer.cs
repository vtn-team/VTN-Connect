using UnityEngine;
using VTNConnect;
using UnityEngine.UI;


/// <summary>
/// イベント管理クラス
/// </summary>
public class EventSystemViewer : MonoBehaviour
{
    [SerializeField] int _eventId;
    [SerializeField] EventData _testData;
    [SerializeField] InputField _inputText;
    [SerializeField] RawImage _outQRImage;

    //test
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            EventData n = new EventData();
            n.DataPack<float>("X", this.transform.position.x);
            n.DataPack("Pos", this.transform.position);
            n.DataPack("Rot", this.transform.rotation);
            EventSystem.SendEvent(_eventId, n);
        }
    }

    public void SendChat()
    {
        _outQRImage.texture = QRCodeMaker.BakeCode(_inputText.text);
        _outQRImage.Rebuild(CanvasUpdate.Layout);
        //EventData n = new EventData();
        //n.DataPack("ThreadId", );
        //n.DataPack("Prompt", _inputText.text);
        //EventSystem.SendEvent(10000, n);
    }

#if UNITY_EDITOR
    public EventData TestData => _testData;
#endif
}
