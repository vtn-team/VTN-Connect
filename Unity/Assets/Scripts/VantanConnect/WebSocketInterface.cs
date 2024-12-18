using Cysharp.Threading.Tasks;
using VTNConnect;

enum WebSocketCommand
{
    WELCOME = 1,
    JOIN = 2,
    EVENT = 3,
    SEND_JOIN = 100,
    SEND_EVENT = 101,
};

public class WebSocketPacket
{
    public int SenderId;
    public int Command;
    public string Data;
};

public class WSPR_Welcome
{
    public string SessionId;
};
public class WSPR_Event : EventData
{
};

public class WSPS_Join
{
    public string SessionId;
    public int GameId;
    public int Command = (int)WebSocketCommand.SEND_JOIN;
};