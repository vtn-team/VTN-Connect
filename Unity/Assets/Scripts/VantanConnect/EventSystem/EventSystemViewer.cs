using UnityEngine;
using VTNConnect;
using UnityEngine.UI;
using UnityEngine.SceneManagement;


/// <summary>
/// イベントテスト用クラス
/// </summary>
public class EventSystemViewer : MonoBehaviour
{
    [SerializeField] int _gameId;
    [SerializeField] int _eventId;
    [SerializeField] EventData _testData;
    [SerializeField] InputField _inputText;
    [SerializeField] RawImage _outQRImage;
    [SerializeField] GameObject _connect;


    private void Start()
    {
        //_outQRImage.texture = QRCodeMaker.BakeCode(""+_gameId);
        //_outQRImage.Rebuild(CanvasUpdate.Layout);
        EventSystem.AddListener(OnEventCall);
    }

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

    void OnEventCall(EventData data)
    {
        Debug.Log(JsonUtility.ToJson(data));
        if (data.EventId == 1000)
        {
            var gameId = data.GetIntData("GameId");
            if (gameId == _gameId)
            {
                _connect.SetActive(true);
            }
        }
    }

    public void SendChat()
    {
        //_outQRImage.texture = QRCodeMaker.BakeCode(_inputText.text);
        //_outQRImage.Rebuild(CanvasUpdate.Layout);
        //EventData n = new EventData();
        //n.DataPack("ThreadId", );
        //n.DataPack("Prompt", _inputText.text);
        //EventSystem.SendEvent(10000, n);
    }

    public void SceneChange(string scene)
    {
        SceneManager.LoadScene(scene);
    }

#if UNITY_EDITOR
    public EventData TestData => _testData;
#endif
}
