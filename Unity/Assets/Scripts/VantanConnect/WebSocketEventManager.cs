using Network;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using MessagePack;
using System;
using System.Text;
using VTNConnect;

public class WebSocketEventManager : MonoBehaviour
{
    [SerializeField] int _gameId = 1;
    [SerializeField] int _eventIndex = -1; 

    public bool IsConnecting { get; private set; } = false;

    WebSocketCli client = new WebSocketCli();

    Queue<EventData> _sendQueue = new Queue<EventData>();
    Queue<EventData> _eventQueue = new Queue<EventData>();

    EventSystem.EventDataCallback _event = null;
    string _sessionId = null;


    void Start()
    {
        Setup();
    }

    async void Setup()
    {
        string address = await GameAPI.GetAddress();
        Connect(address);
    }

    void Update()
    {
        if (_eventQueue.Count > 0)
        {
            foreach (var msg in _eventQueue)
            {
                _event.Invoke(msg);
            }
            _eventQueue.Clear();
        }

        if (_sendQueue.Count == 0) return;

        var d = _sendQueue.Dequeue();
        WSPS_Event data = new WSPS_Event(d);
        data.SessionId = _sessionId;
        client.Send(JsonUtility.ToJson(data));
    }


    void Connect(string address)
    {
        client.Connect(address, Message);
        EventSystem.Setup(Send, out _event);
    }

    //最終的な設計には悩んでいる
    void Send(int eventId, EventData data)
    {
        data.EventId = eventId;
        data.FromId = _gameId;
        _sendQueue.Enqueue(data);
    }

    void Message(byte[] msg)
    {
        WebSocketPacket data = null;
        try
        {
            //data = MessagePackSerializer.Deserialize<ServerResult>(msg);
            string json = Encoding.UTF8.GetString(msg);
            data = JsonUtility.FromJson<WebSocketPacket>(json);
        }
        catch(Exception ex)
        {
            Debug.Log(ex.Message);
        }

        if (data == null) return;

        try
        {
            switch ((WebSocketCommand)data.Command)
            {
            case WebSocketCommand.WELCOME:
            {
                var welcome = JsonUtility.FromJson<WSPR_Welcome>(data.Data);
                var join = new WSPS_Join();
                join.SessionId = welcome.SessionId;
                join.GameId = _gameId;
                client.Send(JsonUtility.ToJson(join));
                _sessionId = welcome.SessionId;
            }
            break;

            case WebSocketCommand.EVENT:
            {
                var evt = JsonUtility.FromJson<WSPR_Event>(data.Data);
                _eventQueue.Enqueue(evt);
            }
            break;
            }
        }
        catch (Exception ex)
        {
            Debug.Log(ex.Message);
        }
    }
}
