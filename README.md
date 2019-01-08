TBA.

API is still a WIP and my vision has changed multiple times but I'm almost at a point where I'd be
comfortable using it in production. Will have official documentation ready for when that time comes.
Till then you can get a good idea of how the library will work by looking over the tests. if you're
curious. The goal is still to center everything and that's exactly what the ChannelCluster class
will specialize in. That will be the main focus as soon as I finish the public API for Back/Front Channels
and the Client.

It seems I've moved a bit away from trying to keep this low level and modular. I will still keep all of that
in mind when writing, but it came to my attention that by implementing a Client class I've coupled the systems
more than I originally had planned. It's okay though, although the Client, FrontChannel, and BackChannel will
be strongly coupled, the finished product will have a robust and flexible API that should be trivial to make changes
and new functionality where needed.