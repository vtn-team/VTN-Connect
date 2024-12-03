using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;

public class AWSLambdaAPIImplement : INetworkImplement
{
    const string URI = "";

    class AWSLambdaAPIResult
    {
        public int statusCode;
        public string body;
    }

    byte[] GetPacketBody(byte[] data)
    {
        string json = Encoding.UTF8.GetString(data);
        AWSLambdaAPIResult result = JsonUtility.FromJson<AWSLambdaAPIResult>(json);
        return Encoding.UTF8.GetBytes(result.body);
    }

    public void Login(string uuid)
    {
        string request = URI.Replace("{Command}/", "GetUser");
        request = request.Replace("/{Param}", "");
        Network.WebRequest.GetRequest(request);
    }

    public void GetUser(string uuid)
    {
        string request = URI.Replace("{Command}/", "GetUser");
        request = request.Replace("/{Param}", "");
        Network.WebRequest.GetRequest(request);
    }

    public void CreateUser(string name)
    {
        string request = URI.Replace("{Command}", "CreateUser");
        request = request.Replace("{Param}", "");
        Network.WebRequest.PostRequest(request, Encoding.UTF8.GetBytes(name));
    }
}
