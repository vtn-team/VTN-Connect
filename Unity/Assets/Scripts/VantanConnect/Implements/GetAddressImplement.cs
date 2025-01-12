using Cysharp.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;


//このAPIはリクエストパラメータはなし


/// <summary>
/// 戻り値
/// </summary>
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
