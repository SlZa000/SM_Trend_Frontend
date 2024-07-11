import React, { useEffect, useState } from 'react';
import { Player } from 'video-react';
import "video-react/dist/video-react.css"; // Importuj styl dla video-react
import Modal from 'react-modal';
import { PostService } from '../../services/PostService';
import { Post, PostFile } from '../../models/PostModel';
import LikeDislikeComponent from './LikeDislikeComponent';
import Login from './Login';
import '../../style/PostComponent.css';
import { FaVolumeUp } from 'react-icons/fa'; // Import icon
import 'react-h5-audio-player/lib/styles.css'; // Import styles for the audio player
import AudioPlayer from 'react-h5-audio-player';

interface PostComponentProps {
  filter: {
    fileType: string;
    searchTerm: string;
  };
  userId: number;
}

const PostComponent: React.FC<PostComponentProps> = ({ filter, userId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jwt'));
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsData = await PostService.getFilteredPosts(filter.fileType, filter.searchTerm);
        const sortedPosts = postsData.sort((a, b) => b.id - a.id);
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, [filter]);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('jwt'));
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const renderFileThumbnail = (file?: PostFile) => {
    if (!file) return null;
    if (file.fileType.startsWith('image/')) {
      return <img src={file.fileUrl} alt={file.fileName} className="img-thumbnail no-download" />;
    }
    if (file.fileType.startsWith('video/')) {
      return (
        <video className="img-thumbnail no-download" disablePictureInPicture controlsList="nodownload noremoteplayback">
          <source src={file.fileUrl} type={file.fileType} />
        </video>
      );
    }
    if (file.fileType.startsWith('audio/')) {
      return (
        <div className="audio-thumbnail">
          <FaVolumeUp size={50} />
        </div>
      );
    }
    return <div className="img-thumbnail no-download">{file.fileType}</div>;
  };

  const renderFileInModal = (file?: PostFile) => {
    if (!file) return null;
    if (file.fileType.startsWith('image/')) {
      return <img src={file.fileUrl} alt={file.fileName} className="img-fluid" />;
    }
    if (file.fileType.startsWith('video/')) {
      return (
        <div className="video-container">
          <Player>
            <source src={file.fileUrl} />
          </Player>
        </div>
      );
    }
    if (file.fileType.startsWith('audio/')) {
      return (
        <div className="audio-container">
          <AudioPlayer
            src={file.fileUrl}
            onPlay={() => console.log("onPlay")}
            // other props here
          />
        </div>
      );
    }
    return <div>{file.fileType}</div>;
  };

  const handleTileClick = (post: Post) => {
    setSelectedPost(post);
  };

  const closeModal = () => {
    setSelectedPost(null);
  };

  return (
    <div className="container mt-3">
      <div className="row">
        {posts.map((post) => (
          <div key={post.id} className="col-md-3 mb-3">
            <div
              className="post-tile p-3 border rounded"
              onClick={() => handleTileClick(post)}
              style={{ cursor: 'pointer' }}
            >
              <h3>{truncateText(post.title, 15)}</h3>
              <p>{truncateText(post.content, 30)}</p>
              {post.files && post.files.length > 0 && renderFileThumbnail(post.files[0])}
              <p>File Type: {post.files && post.files.length > 0 ? post.files[0].fileType : 'Brak plików'}</p>
              <p>Likes: {post.likes} Dislikes: {post.dislikes}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedPost} onRequestClose={closeModal} className="post-modal" overlayClassName="modal-overlay">
        <div className="modal-content">
          <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}>&times;</button>
          {selectedPost && (
            <div className="row">
              <div className="col-md-7">
                <h3>{selectedPost.title}</h3>
                {selectedPost.files && selectedPost.files.length > 0 ? (
                  renderFileInModal(selectedPost.files[0])
                ) : (
                  <p>{selectedPost.content}</p>
                )}
              </div>
              <div className="col-md-5 d-flex flex-column justify-content-center">
                {selectedPost.files && selectedPost.files.length > 0 && (
                  <>
                    {!isLoggedIn && (
                      <p>
                        Aby pobrać plik, <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-link">zaloguj się</button>.
                      </p>
                    )}
                    {isLoggedIn && (
                      <a href={selectedPost.files[0].fileUrl} download={selectedPost.files[0].fileName} className="btn btn-primary">Download</a>
                    )}
                  </>
                )}
                <p>{selectedPost.content}</p>
                <LikeDislikeComponent postId={selectedPost.id} initialLikes={selectedPost.likes} initialDislikes={selectedPost.dislikes} userId={userId} />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={isLoginModalOpen} onRequestClose={() => setIsLoginModalOpen(false)} className="login-modal" overlayClassName="modal-overlay">
        <div className="modal-content">
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setIsLoginModalOpen(false)}>&times;</button>
          <Login setUser={(user) => { if (user) setIsLoggedIn(true); }} closeModal={() => setIsLoginModalOpen(false)} />
        </div>
      </Modal>
    </div>
  );
};

export default PostComponent;
