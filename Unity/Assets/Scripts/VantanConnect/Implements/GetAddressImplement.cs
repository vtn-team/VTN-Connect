using Cysharp.Threading.Tasks;
using System;
using UnityEngine;


//このAPIはリクエストパラメータはなし


/// <summary>
/// 戻り値
/// </summary>
[Serializable]
public class GetAddrResult
{
    public int Status;
    public string Address;
}

/// <summary>
/// WebSocketアドレス取得
/// </summary>
public class GetAddressImplement
{
    async public UniTask<string> Request()
    {
        string request = String.Format("{0}/getaddr", ProjectSettings.APIServerURI);
        string json = await Network.WebRequest.GetRequest(request);
        var ret = JsonUtility.FromJson<GetAddrResult>(json);
        return ret.Address;
    }
}
