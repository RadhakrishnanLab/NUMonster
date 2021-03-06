package Email;
use strict;
use warnings;

use Net::SMTP;
use File::Basename;

my $Debug = 0;

sub initEmail{
    my $self = shift;
    my $job = shift;
    my $file = shift;
    my $pdb = $file;
    $pdb =~ s/\.ent\.gz$//;

    my $xml = shift;
    my $recipient = $xml->getEmail();
    my $sender = "monster\@numonster.northwestern.edu";
    return 0 if $recipient eq "";

    my $msg = "Monster has started running the job for this file:\n\n";
    $msg.=$pdb."\n\n";    
    $msg.="Under this job id:\n\n";
    $msg.=$job."\n\n";
	
    $msg.="Monster will be running this job on these chains and their user-definied limits:\n\n";
    
    foreach my $ch(sort($xml->chains)){
	$msg.="$ch: ".$xml->start($ch)." -> ".$xml->end($ch)."\n";
    }
    $msg.="\n";
    $msg.="The actual chain pairs chosen are:\n";
    $msg.=join(',',sort($xml->chainpairs));
    $msg.="\n\nMonster will remove any protons and use WhatIf to add protons.\n" if $xml->getProtons;
    $msg.="\n\nMonster will NOT replace any protons.\n" unless $xml->getProtons;
    $msg.="\n\nJobs will reside on the server for 14 days before they are removed.\n";

    open(MAIL,"|/usr/lib/sendmail -t");
    print MAIL "to: ".$recipient."\n";
    print MAIL "from: ".$sender."\n";
    print MAIL "Subject: New Job for Monster\n";
    print MAIL $msg;
    close(MAIL);
}

sub resultEmail{
    my $self = shift;
    my $job = shift;
    my $recipient = shift;
    my $file = shift;
    my $pdb = $file;
    $pdb =~ s/\.ent\.gz$//;

    my $sender = "monster\@numonster.northwestern.edu";
    return 0 if $recipient eq "";

    my $msg.="Monster has finished running the job for this file:\n\n";
    $msg.=$pdb."\n\n";
    $msg.="Under this job id:\n\n";
    $msg.=$job."\n\n";

    if($_[0] && -e $_[0]){
	$msg.="You may now go to the Monster website and retrieve your results\n";
	$msg.="by entering the job id in the 'Job ID' field\n";
	$msg.="and pressing 'Get Result'\n\n";
	$msg.="If no results for a particular chain pair are listed, this means Monster did not find any interactions between those chains.\n\n";
	$msg.="Results have been appended and found below:\n";

	foreach my $result (@_){
	    my ($name, $junk1, $junk2)=fileparse($result);
	    $msg.="\n\nFile: $name\n";
	    open(MAIL, "< $result");
	    while(<MAIL>){
		$msg.=$_;
	    }
	    close(MAIL);
	}
    }else{
	$msg.="Unfortunately, no interactions were found.\n";
	$msg.="This can be the case if the chain pairs submitted are not within 7 angstroms of each other.\n";
	$msg.="If you believe this to be an error, please contact monster\@monster.northwestern.edu with the job id\n\n";
    }

    open(MAIL,"|/usr/lib/sendmail -t");
    print MAIL "to: ".$recipient."\n";
    print MAIL "from: ".$sender."\n";
    print MAIL "Subject: Results for Monster: ".$pdb."\n";
    print MAIL $msg;
    close(MAIL);
}

sub old_initEmail{
    my $self = shift;
    my $job = shift;
    my $file = shift;
    my $pdb = $file;
    $pdb =~ s/\.ent\.gz$//;

    my $xml = shift;

    my $smtp = Net::SMTP->new("monster.northwestern.edu", Debug => $Debug);
    
    my $recipient= $xml->getEmail();
    return 0 if $recipient eq "";

    if(defined $smtp){
	$smtp->mail("monster\@monster.northwestern.edu");
	$smtp->to($recipient);
	$smtp->data();
	$smtp->datasend('To: '.$recipient);
	$smtp->datasend("\n");
	$smtp->datasend("Subject: New Job for Monster\n");
	$smtp->datasend("Monster has started running the job for this file:\n\n");
	$smtp->datasend($pdb."\n\n");
	$smtp->datasend("Under this job id:\n\n");
	$smtp->datasend($job."\n\n");
	
	$smtp->datasend("Monster will be running this job on these chains and their user-definied limits:\n\n");

	foreach my $ch(sort($xml->chains)){
	    $smtp->datasend("$ch: ".$xml->start($ch)." -> ".$xml->end($ch)."\n");
	}
	$smtp->datasend("\n");
	$smtp->datasend("The actual chain pairs chosen are:\n");
	$smtp->datasend(join(',',sort($xml->chainpairs)));
	$smtp->datasend("\n\nMonster will remove any protons and use WhatIf to add protons.\n") if $xml->getProtons;
	$smtp->datasend("\n\nMonster will NOT replace any protons.\n") unless $xml->getProtons;
	$smtp->datasend("\n\nJobs will reside on the server for 14 days before they are removed.");

	$smtp->dataend();
	$smtp->quit();
	return 1;
    }else{
	return 0;
    }
}

sub old_resultEmail{
    my $self = shift;
    my $job = shift;
    my $recipient = shift;
    my $file = shift;
    my $pdb = $file;
    $pdb =~ s/\.ent\.gz$//;

    my $smtp = Net::SMTP->new("monster.northwestern.edu", Debug => $Debug);
    return 0 if $recipient eq "";
    
    if(defined $smtp){
	$smtp->mail("monster\@monster.northwestern.edu");
	$smtp->to($recipient);
	$smtp->data();
	$smtp->datasend('To: '.$recipient);
	$smtp->datasend("\n");
	$smtp->datasend("Subject: Results for Monster: ".$pdb."\n");
	$smtp->datasend("Monster has finished running the job for this file:\n\n");
	$smtp->datasend($pdb."\n\n");
	$smtp->datasend("Under this job id:\n\n");
	$smtp->datasend($job."\n\n");
	
	if($_[0] && -e $_[0]){
	    $smtp->datasend("You may now go to the Monster website and retrieve your results\n");
	    $smtp->datasend("by entering the job id in the 'Job Retriever' field\n\n");
	    $smtp->datasend("Alternatively, you may use this link:\n\n");
	    $smtp->datasend("http://monster.northwestern.edu/monster.jsp?pji=".$job."\n\n");
	    $smtp->datasend("and pressing 'Submit'\n\n");
	    $smtp->datasend("If no results for a particular chain pair are listed below, this means Monster did not find any interactions.\n\n");
	    $smtp->datasend("Jobs will reside on the server for 14 days before they are removed.\n\n");
	    $smtp->datasend("Results have been appended and found below:\n");

	    foreach my $result (@_){
		my ($name, $junk1, $junk2)=fileparse($result);
		$smtp->datasend("\n\nFile: $name\n");
		open(MAIL, "< $result");
		while(<MAIL>){
		    $smtp->datasend($_);
		}
		close(MAIL);
	    }
	}else{
	    $smtp->datasend("Unfortunately, no interactions were found.\n");
	    $smtp->datasend("This can be the case if the chain pairs submitted are not within 7 angstroms of each other.\n");
	    $smtp->datasend("If you believe this to be an error, please contact monster\@monster.northwestern.edu with the job id\n\n");
	}
	$smtp->dataend();
	$smtp->quit();
	return 1;
    }else{
	return 0;
    }
}

1;
