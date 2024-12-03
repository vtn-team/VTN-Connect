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
    [SerializeField] string _host = "ws://localhost:3000/"; //ws://35.72.48.33:3000/
    [SerializeField] int _eventIndex = -1; 

    public bool IsConnecting { get; private set; } = false;

    WebSocketCli client = new WebSocketCli();

    Queue<EventData> _sendQueue = new Queue<EventData>();
    Queue<EventData> _eventQueue = new Queue<EventData>();

    EventSystem.EventDataCallback _event = null;


    void Start()
    {
        Connect();
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

        var data = _sendQueue.Dequeue();
        client.Send(JsonUtility.ToJson(data));
    }


    void Connect()
    {
        client.Connect(_host, Message);
        EventSystem.Setup(Send, out _event);
    }

    void Send(EventData data)
    {
        _sendQueue.Enqueue(data);
    }

    void Message(byte[] msg)
    {
        EventData data = null;
        try
        {
            //data = MessagePackSerializer.Deserialize<ServerResult>(msg);
            string json = Encoding.UTF8.GetString(msg);
            data = JsonUtility.FromJson<EventData>(json);
        }
        catch(Exception ex)
        {
            Debug.Log(ex.Message);
        }

        if (data == null) return;

        try
        {
            _eventQueue.Enqueue(data);
        }
        catch (Exception ex)
        {
            Debug.Log(ex.Message);
        }
    }
}
