using UnityEngine;
using System.Collections;
using WebSocketSharp;
using WebSocketSharp.Net;

public class WebSocketCli
{
    public delegate void WebSocketMessageCallback(byte[] msg);
    
    WebSocket _webSocket;
    WebSocketMessageCallback _callback;

    public void Connect(string host, WebSocketMessageCallback callback)
    {
        _webSocket = new WebSocket(host);
        _callback = callback;

        _webSocket.OnOpen += (sender, e) =>
        {
            Debug.Log("WebSocket Open");
        };

        _webSocket.OnMessage += (sender, e) =>
        {
            Debug.Log("WebSocket Message Data: " + System.Text.Encoding.UTF8.GetString(e.RawData));
            _callback?.Invoke(e.RawData);
        };

        _webSocket.OnError += (sender, e) =>
        {
            Debug.Log("WebSocket Error Message: " + e.Message);
        };

        _webSocket.OnClose += (sender, e) =>
        {
            Debug.Log("WebSocket Close");
        };

        _webSocket.Connect();
    }

    public void Send(string msg)
    {
        _webSocket.Send(msg);
    }

    public void Send<T>(T obj)
    {
        string msg = JsonUtility.ToJson(obj);
        _webSocket.Send(msg);
    }

    public void Close()
    {
        _webSocket.Close();
        _webSocket = null;
    }
}

/*
using UnityEngine;
using System.Collections;
using System.Net.WebSockets;
using System;
using System.Threading;
using System.Text;

public class ClientExample : MonoBehaviour
{
    [SerializeField] string host = "ws://xx.xx.xx.xx:3000";
    ClientWebSocket _webSocket = new ClientWebSocket();
    byte[] buffer = new byte[1024];

    void Start()
    {
        Connect();
    }

    async void Connect()
    {
        //�ڑ���G���h�|�C���g���w��
        var uri = new Uri(host);

        //�T�[�o�ɑ΂��A�ڑ����J�n
        await _webSocket.ConnectAsync(uri, CancellationToken.None);
    }

    void Update()
    {
        Receive();
    }

    async void Receive()
    {
        //�������m�ۗp�̔z�������
        var segment = new ArraySegment<byte>(buffer);

        //�T�[�o����̃��X�|���X�����擾
        var result = await _webSocket.ReceiveAsync(segment, CancellationToken.None);

        //�G���h�|�C���gClose�̏ꍇ�A�����𒆒f
        if (result.MessageType == WebSocketMessageType.Close)
        {
            await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "OK",
              CancellationToken.None);
            return;
        }

        //�o�C�i���̏ꍇ�́A�������ł͈����Ȃ����߁A�����𒆒f
        if (result.MessageType == WebSocketMessageType.Binary)
        {
            await _webSocket.CloseAsync(WebSocketCloseStatus.InvalidMessageType,
              "I don't do binary", CancellationToken.None);
            return;
        }

        //���b�Z�[�W�̍Ō�܂Ŏ擾
        int count = result.Count;
        while (!result.EndOfMessage)
        {
            if (count >= buffer.Length)
            {
                await _webSocket.CloseAsync(WebSocketCloseStatus.InvalidPayloadData,
                  "That's too long", CancellationToken.None);
                return;
            }
            segment = new ArraySegment<byte>(buffer, count, buffer.Length - count);
            result = await _webSocket.ReceiveAsync(segment, CancellationToken.None);

            count += result.Count;
        }

        //���b�Z�[�W���擾
        var message = Encoding.UTF8.GetString(buffer, 0, count);
        Debug.Log("> " + message);
    }
}
*/