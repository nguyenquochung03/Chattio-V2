// src/contexts/HomeContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const HomeContext = createContext();

export const useHome = () => {
  return useContext(HomeContext);
};

export const HomeProvider = ({ children }) => {
  const [isSidebarHidden, setIsSidebarHidden] = useState(true);

  //// Trang danh sách lời mời kết bạn gửi đến
  // Dữ liệu danh sách lời mời kết bạn gửi đến
  const [friendRequests, setFriendRequests] = useState([]);
  // Lưu trang hiện tại đã load đến
  const [friendRequestsPage, setFriendRequestsPage] = useState(2);
  // Có tải dữ liệu chưa
  const [isLoadedFriendRequests, setIsLoadedFriendRequests] = useState(false);

  //// Trang danh sách bạn bè được gợi ý
  // Danh sách bạn bè được khuyến nghị
  const [suggestions, setSuggestions] = useState([]);
  // Lưu trang hiện tại đã load đến
  const [suggestionsPage, setSuggestionsPage] = useState(2);
  // Có tải dữ liệu chưa
  const [isLoadedSuggestedUser, setIsLoadedSuggestedUser] = useState(false);

  //// Trang danh sách bạn bè đã gửi
  // Danh sách thêm bạn bè đã gửi
  const [sentRequests, setSentRequests] = useState([]);
  // Lưu trang hiện tại đã load đến
  const [sentRequestsPage, setSentRequestsPage] = useState(2);
  // Có tải dữ liệu chưa
  const [isLoadedSentRequests, setIsLoadedSentRequests] = useState(false);

  //// Trang danh sách bạn bè hiện tại
  // Danh sách bạn bè hiện tại
  const [friends, setFriends] = useState([]);
  // Lưu trang hiện tại đã load đến
  const [friendsPage, setFriendsPage] = useState(2);
  // Có tải dữ liệu chưa
  const [isLoadedFriends, setIsLoadedFriends] = useState(false);

  // Danh sách tin nhắn
  // Danh sách tin nhắn hiện tại
  const [listFriends, setListFriends] = useState([]);
  // Lưu trang hiện tại đã load đến
  const [listFriendsPage, setListFriendsPage] = useState(2);
  // Có tải dữ liệu chưa
  const [isLoadedListFriends, setIsLoadedListFriends] = useState(false);
  // Đang chọn đoạn chat nào
  const [selectedFriendId, setSelectedFriendId] = useState(0);
  // Thông tin tin nhắn cuối cùng ứng với friend
  const [lastMessagesMap, setLastMessagesMap] = useState([]);
  // Có tải dữ liệu chưa
  const [isLoadedLastMessagesMap, setIsLoadedLastMessagesMap] = useState(false);
  // Kiểm tra đã thực hiện tìm kiếm chưa
  const [isSearchFriend, setIsSearchFriend] = useState(false);
  // Danh sách tìm kiếm
  const [searchFriendsData, setSearchFriendsData] = useState([]);
  //
  const messageRef = useRef(null);

  // Gía trị người dùng được chọn khi chọn vào một tin nhắn
  const [userToChat, setUserToChat] = useState({});
  // Lấy user khi mới truy cập vào trang web
  const [isLoadUserToChat, setIsLoadUserToChat] = useState(false);
  // Ẩn/hiện tin nhắn và danh sách tin nhắn với từng bạn bè
  const [isShowChat, setIsShowChat] = useState(true);
  const [isShowList, setIsShowList] = useState(true);
  const [isShowChatInfo, setIsShowChatInfo] = useState(false);

  //// Danh sách tin nhắn của một cuộc hội thoại
  const [listChats, setListChats] = useState([]);
  // Lưu trang hiện tại đã load đến
  const [listChatsPage, setListChatsPage] = useState(2);
  // Xem đã chọn tin nhắn nào
  const [selectedChat, setselectedChat] = useState("");
  // Lưu lại để lấy thêm tin nhắn
  const [hasMoreChats, setHasMoreChats] = useState(true);

  //// Thông tin cuộc hội thoại
  const [conversation, setConversation] = useState({});
  // Xem người dùng đã tắt thông báo cuộc hội thoại chưa
  const [isMuteConversation, setIsMuteConversation] = useState(false);
  // Trạng thái tắt thông báo
  const [muteNotificationValue, setMuteNotificationValue] = useState(15);
  // Tải giá trị cuộc hội thoại cho lần đầu truy cập
  const [
    isLoadedConversationForFirstTime,
    setIsLoadedConversationForFirstTime,
  ] = useState(false);
  // Kiểm tra có đang chặn bạn bè không
  const [checkBlocked, setCheckBlocked] = useState({});
  // Tải giá trị chặn cho lần đầu truy cập
  const [isLoadedCheckBlocked, setIsLoadedCheckBlocked] = useState(false);
  // Danh sách media file
  const [listMediaFile, setListMediaFile] = useState([]);
  // Danh sách raw file
  const [listRawFile, setListRawFile] = useState([]);

  // Kiểm tra có đang nhập gì không
  const [isTyping, setIsTyping] = useState(false);

  //// Danh sách lời mời kết bạn đã được chấp nhận và đang chờ xác nhận
  // Danh sách lời mời kết bạn đã được chấp nhận và đang chờ xác nhận hiện tại
  const [acceptedConfirms, setAcceptedConfirms] = useState([]);
  // Lưu trang hiện tại đã load đến
  const [acceptedConfirmsPage, setAcceptedConfirmsPage] = useState(2);

  //// Trang tìm kiếm tin nhắn trong cuộc trò chuyện
  const [isSearching, setIsSearching] = useState(false);
  // Tin nhắn tìm là tin nhắn nào
  const [messageToSearch, setMessageToSearch] = useState({});
  // Danh sách liên quan đến tin nhắn đã được chọn để tìm
  const [listMessageToSeach, setListMessageToSeach] = useState([]);
  // Lưu lại giá trị hiện đã load đến
  const [searchMessagePages, setSearchMessagePages] = useState(0);
  // Có dữ liệu để tải nữa không
  const [hasMoreNext, setHasMoreNext] = useState(true);
  const [hasMorePrev, setHasMorePrev] = useState(true);
  // Từ khóa tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");

  //// Hiển thị dialog cuộc gọi đến
  const [isShowIncomingCall, setIsShowIncomingCall] = useState(false);
  // Các trạng thái mà cuộc gọi có thể có
  const [callStatus, setCallStatus] = useState("");
  // Lấy thông tin người gọi
  const [userToCall, setUserToCall] = useState({});
  // Cửa sổ đang mở
  const [popupWindow, setPopupWindow] = useState(null);

  //// Trang cuộc gọi mà không có video
  const [isShowNormalIncomingCall, setIsShowNormalIncomingCall] =
    useState(false);

  // Kiểm tra có phải là người gọi không
  const [isCaller, setIsCaller] = useState(true);
  // Kiểm tra đã nhận sự kiện bị từ chối cuộc gọi chưa
  const callDeclinedHandled = useRef(false);

  const [elapsedTime, setElapsedTime] = useState(0); // Thời gian đã trôi qua
  const timerRef = useRef(null); // Lưu giữ interval

  //// Xử lý file
  const [selectedFile, setSelectedFile] = useState(null); // State để lưu file đã chọn
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // URL xem trước ảnh
  const [selectedImage, setSelectedImage] = useState(""); // Chọn ảnh để hiển thị
  const [openImageViewer, setOpenImageViewer] = useState(false); // Hiển thị ảnh
  const [isViewAll, setIsViewAll] = useState(false); // Hiển thị tất cả file
  const [activeTab, setActiveTab] = useState(0); // Chọn tab nào để xem file

  //// Ghi âm
  const [isRecording, setIsRecording] = useState(false);

  //// Dialog cập nhật ảnh đại diện
  const [isOpenChangeAvatarDialog, setIsOpenChangeAvatarDialog] =
    useState(false);

  return (
    <HomeContext.Provider
      value={{
        isSidebarHidden,
        setIsSidebarHidden,
        //// Trang danh sách lời mời kết bạn gửi đến
        friendRequests,
        setFriendRequests,
        friendRequestsPage,
        setFriendRequestsPage,
        isLoadedFriendRequests,
        setIsLoadedFriendRequests,
        //// Trang danh sách bạn bè được gợi ý/đã gửi lời mời/bạn bè hiện tại
        suggestions,
        setSuggestions,
        suggestionsPage,
        setSuggestionsPage,
        isLoadedSuggestedUser,
        setIsLoadedSuggestedUser,
        sentRequests,
        setSentRequests,
        sentRequestsPage,
        setSentRequestsPage,
        isLoadedSentRequests,
        setIsLoadedSentRequests,
        friends,
        setFriends,
        friendsPage,
        setFriendsPage,
        isLoadedFriends,
        setIsLoadedFriends,
        acceptedConfirms,
        setAcceptedConfirms,
        acceptedConfirmsPage,
        setAcceptedConfirmsPage,
        //// Danh sách tin nhắn hiện tại
        listFriends,
        setListFriends,
        listFriendsPage,
        setListFriendsPage,
        isLoadedListFriends,
        setIsLoadedListFriends,
        selectedFriendId,
        setSelectedFriendId,
        lastMessagesMap,
        setLastMessagesMap,
        isLoadedLastMessagesMap,
        setIsLoadedLastMessagesMap,
        selectedChat,
        setselectedChat,
        isSearchFriend,
        setIsSearchFriend,
        searchFriendsData,
        setSearchFriendsData,
        //// Giao diện tin nhắn
        userToChat,
        setUserToChat,
        isLoadUserToChat,
        setIsLoadUserToChat,
        isShowChat,
        setIsShowChat,
        isShowList,
        setIsShowList,
        isShowChatInfo,
        setIsShowChatInfo,
        hasMoreChats,
        setHasMoreChats,
        //// Danh sách tin nhắn
        listChats,
        setListChats,
        listChatsPage,
        setListChatsPage,
        //// Thông tin cuộc hội thoại
        conversation,
        setConversation,
        isMuteConversation,
        setIsMuteConversation,
        muteNotificationValue,
        setMuteNotificationValue,
        isLoadedConversationForFirstTime,
        setIsLoadedConversationForFirstTime,
        checkBlocked,
        setCheckBlocked,
        isLoadedCheckBlocked,
        setIsLoadedCheckBlocked,
        listMediaFile,
        setListMediaFile,
        listRawFile,
        setListRawFile,
        //// Kiểm tra xem có đang nhập gì không
        isTyping,
        setIsTyping,
        //// Trang tìm kiếm tin nhắn trong cuộc trò chuyện
        isSearching,
        setIsSearching,
        messageToSearch,
        setMessageToSearch,
        listMessageToSeach,
        setListMessageToSeach,
        searchQuery,
        setSearchQuery,
        searchMessagePages,
        setSearchMessagePages,
        hasMoreNext,
        setHasMoreNext,
        hasMorePrev,
        setHasMorePrev,
        messageRef,
        //// Trang quản lý cuộc gọi
        isShowIncomingCall,
        setIsShowIncomingCall,
        callStatus,
        setCallStatus,
        userToCall,
        setUserToCall,
        popupWindow,
        setPopupWindow,
        isShowNormalIncomingCall,
        setIsShowNormalIncomingCall,
        isCaller,
        setIsCaller,
        callDeclinedHandled,
        elapsedTime,
        setElapsedTime,
        timerRef,
        //// Xử lý file
        selectedFile,
        setSelectedFile,
        imagePreviewUrl,
        setImagePreviewUrl,
        selectedImage,
        setSelectedImage,
        openImageViewer,
        setOpenImageViewer,
        isViewAll,
        setIsViewAll,
        activeTab,
        setActiveTab,
        //// Ghi âm
        isRecording,
        setIsRecording,
        //// Dialog cập nhật ảnh đại diện
        isOpenChangeAvatarDialog,
        setIsOpenChangeAvatarDialog,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
};
