import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Pin, 
  Search,
  Filter,
  Bell,
  Users,
  Paperclip,
  Smile,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Team } from "@/services/team.service";
import { format, isToday, isYesterday } from "date-fns";
import { CreateAnnouncementDialog } from ".";

interface TeamCommunicationProps {
  team: Team;
}

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  type: 'message' | 'announcement' | 'system';
  isPinned?: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  isPinned: boolean;
  readBy: string[];
  tags: string[];
}

export function TeamCommunication({ team }: TeamCommunicationProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageFilter, setMessageFilter] = useState<string>("all");
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);

  useEffect(() => {
    fetchCommunicationData();
  }, [team.id]);

  const fetchCommunicationData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Great work on the project milestone everyone! 🎉',
          author: { id: '1', name: 'John Manager' },
          timestamp: new Date(),
          type: 'message',
          reactions: [
            { emoji: '👍', count: 5, users: ['1', '2', '3', '4', '5'] },
            { emoji: '🎉', count: 3, users: ['2', '4', '6'] }
          ]
        },
        {
          id: '2',
          content: 'Team standup meeting moved to 10 AM tomorrow.',
          author: { id: '2', name: 'Sarah HR' },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'announcement',
          isPinned: true
        },
        {
          id: '3',
          content: 'Can someone help me with the API integration?',
          author: { id: '3', name: 'Mike Developer' },
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          type: 'message'
        },
        {
          id: '4',
          content: 'New team member Alice Johnson joined the team',
          author: { id: 'system', name: 'System' },
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          type: 'system'
        }
      ];

      const mockAnnouncements: Announcement[] = [
        {
          id: '1',
          title: 'Q4 Planning Session',
          content: 'We will be conducting our Q4 planning session next Friday. Please prepare your project updates and goals for the upcoming quarter.',
          author: { id: '1', name: 'John Manager' },
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          priority: 'high',
          isPinned: true,
          readBy: ['1', '2', '3'],
          tags: ['planning', 'quarterly']
        },
        {
          id: '2',
          title: 'New Development Guidelines',
          content: 'Updated coding standards and review process are now available in the team wiki. Please review and follow the new guidelines for all future PRs.',
          author: { id: '2', name: 'Sarah HR' },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          priority: 'medium',
          isPinned: false,
          readBy: ['1', '2'],
          tags: ['development', 'guidelines']
        }
      ];

      setMessages(mockMessages);
      setAnnouncements(mockAnnouncements);
    } catch (error: any) {
      console.error('Failed to fetch communication data:', error);
      toast({
        variant: "destructive",
        title: "Failed to load team communication",
        description: error.message || "Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      author: { id: 'current-user', name: 'You' },
      timestamp: new Date(),
      type: 'message'
    };

    setMessages(prev => [message, ...prev]);
    setNewMessage("");
    
    toast({
      title: "Message sent",
      description: "Your message has been sent to the team.",
    });
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          existingReaction.count += 1;
          existingReaction.users.push('current-user');
        } else {
          reactions.push({ emoji, count: 1, users: ['current-user'] });
        }
        
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const handlePinMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
    ));
    
    toast({
      title: "Message pinned",
      description: "Message has been pinned to the top of the channel.",
    });
  };

  const handleAnnouncementCreated = (announcement: Announcement) => {
    setAnnouncements(prev => [announcement, ...prev]);
    setShowAnnouncementDialog(false);
    toast({
      title: "Announcement created",
      description: "Your announcement has been posted to the team.",
    });
  };

  const formatMessageTime = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm');
    } else if (isYesterday(timestamp)) {
      return `Yesterday ${format(timestamp, 'HH:mm')}`;
    } else {
      return format(timestamp, 'MMM d, HH:mm');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = messageFilter === "all" || 
                         (messageFilter === "pinned" && message.isPinned) ||
                         (messageFilter === "announcements" && message.type === "announcement") ||
                         (messageFilter === "messages" && message.type === "message");
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-32 animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Team Communication</h3>
          <p className="text-sm text-muted-foreground">
            Stay connected with your team through messages and announcements
          </p>
        </div>
        <Button onClick={() => setShowAnnouncementDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Bell className="w-4 h-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Team Chat</CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={messageFilter} onValueChange={setMessageFilter}>
                        <SelectTrigger className="w-[120px]">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="messages">Messages</SelectItem>
                          <SelectItem value="announcements">Announcements</SelectItem>
                          <SelectItem value="pinned">Pinned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-96 px-4">
                    <div className="space-y-4">
                      {filteredMessages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={`flex space-x-3 p-3 rounded-lg hover:bg-accent transition-colors ${
                            message.isPinned ? 'bg-blue-50 border border-blue-200' : ''
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.author.name}`} />
                            <AvatarFallback className="text-xs">
                              {message.author.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{message.author.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {message.type === 'announcement' && (
                                <Badge variant="secondary" className="text-xs">
                                  <Bell className="w-3 h-3 mr-1" />
                                  Announcement
                                </Badge>
                              )}
                              {message.isPinned && (
                                <Pin className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-foreground mb-2">{message.content}</p>
                            
                            {/* Reactions */}
                            {message.reactions && message.reactions.length > 0 && (
                              <div className="flex items-center space-x-2 mb-2">
                                {message.reactions.map((reaction) => (
                                  <button
                                    key={reaction.emoji}
                                    onClick={() => handleReaction(message.id, reaction.emoji)}
                                    className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
                                  >
                                    <span>{reaction.emoji}</span>
                                    <span>{reaction.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReaction(message.id, '👍')}
                                className="h-6 px-2 text-xs"
                              >
                                <Smile className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePinMessage(message.id)}
                                className="h-6 px-2 text-xs"
                              >
                                <Pin className="w-3 h-3" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Reply</DropdownMenuItem>
                                  <DropdownMenuItem>Copy Link</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="min-h-[40px] max-h-[120px] resize-none pr-20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <div className="absolute right-2 bottom-2 flex space-x-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Paperclip className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Smile className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Team Members Online */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {team.members.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        </div>
                        <span className="text-sm">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pinned Messages */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pin className="w-5 h-5" />
                    Pinned Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {messages.filter(m => m.isPinned).slice(0, 3).map((message) => (
                      <div key={message.id} className="p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium">{message.author.name}</p>
                        <p className="text-sm truncate">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={announcement.isPinned ? 'border-blue-200 bg-blue-50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{announcement.title}</h4>
                          <Badge className={getPriorityColor(announcement.priority)}>
                            {announcement.priority}
                          </Badge>
                          {announcement.isPinned && (
                            <Pin className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{announcement.author.name}</span>
                          <span>•</span>
                          <span>{format(announcement.createdAt, 'MMM d, yyyy')}</span>
                          <span>•</span>
                          <span>{announcement.readBy.length} read</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Pin/Unpin</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{announcement.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {announcement.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm">
                        Mark as Read
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Announcement Dialog */}
      <CreateAnnouncementDialog
        open={showAnnouncementDialog}
        onOpenChange={setShowAnnouncementDialog}
        teamId={team.id}
        onAnnouncementCreated={handleAnnouncementCreated}
      />
    </div>
  );
}